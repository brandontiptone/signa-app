const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/superAdmin');
const { genererFacturePdf } = require('../utils/invoicePdf');
const { envoyerFactureParEmail } = require('../utils/mailer');

const router = express.Router();
router.use(auth, requireSuperAdmin);

// Génère un numéro de facture lisible et unique, ex : FAC-2026-0001
async function genererNumeroFacture() {
  const count = await prisma.facture.count();
  const annee = new Date().getFullYear();
  return `FAC-${annee}-${String(count + 1).padStart(4, '0')}`;
}

// ----- PACKS -----
router.get('/plans', async (req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { prixMensuel: 'asc' } });
  res.json(plans);
});

router.post('/plans', async (req, res) => {
  const { nom, prixMensuel, maxTechniciens } = req.body;
  const plan = await prisma.plan.create({
    data: { nom, prixMensuel, maxTechniciens: maxTechniciens || null },
  });
  res.status(201).json(plan);
});

// ----- ORGANISATIONS (entreprises clientes) -----

// Liste de toutes les entreprises, avec leur pack et le nombre de techniciens utilisés
router.get('/organisations', async (req, res) => {
  const orgs = await prisma.organisation.findMany({
    include: { plan: true, users: { select: { id: true, role: true, nom: true, prenom: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const result = orgs.map((org) => {
    const admins = org.users.filter((u) => u.role === 'ADMIN');
    const techniciens = org.users.filter((u) => u.role === 'COMMERCIAL');
    return {
      id: org.id,
      nom: org.nom,
      statut: org.statut,
      plan: org.plan,
      admins,
      techniciensUtilises: techniciens.length,
      techniciensMax: org.plan.maxTechniciens,
      createdAt: org.createdAt,
    };
  });
  res.json(result);
});

// Créer une nouvelle entreprise cliente + son premier compte admin
router.post('/organisations', async (req, res) => {
  try {
    const { nomEntreprise, planId, adminNom, adminPrenom, adminEmail, adminPassword } = req.body;
    if (!nomEntreprise || !planId || !adminNom || !adminPrenom || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Pack introuvable' });

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const hash = await bcrypt.hash(adminPassword, 10);

    const organisation = await prisma.organisation.create({
      data: {
        nom: nomEntreprise,
        planId,
        users: {
          create: {
            nom: adminNom,
            prenom: adminPrenom,
            email: adminEmail,
            password: hash,
            role: 'ADMIN',
          },
        },
        // Première facture générée automatiquement à la création (mois en cours, impayée)
        factures: {
          create: {
            numero: await genererNumeroFacture(),
            montant: plan.prixMensuel,
            periode: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            dateEcheance: new Date(new Date().setDate(new Date().getDate() + 14)),
          },
        },
        // Résultats par défaut (l'admin pourra les renommer/adapter à son métier
        // depuis les paramètres — ex : "Réparé" / "À recontacter" pour un dépanneur)
        resultats: {
          create: [
            { label: 'Signé', estPositif: true, ordre: 0 },
            { label: 'Non signé', estPositif: false, ordre: 1 },
          ],
        },
      },
      include: { plan: true, users: true, factures: true, resultats: true },
    });

    res.status(201).json(organisation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fiche détaillée d'une entreprise : infos, pack, équipe, ET historique de facturation
router.get('/organisations/:id', async (req, res) => {
  try {
    const org = await prisma.organisation.findUnique({
      where: { id: req.params.id },
      include: {
        plan: true,
        users: { select: { id: true, role: true, nom: true, prenom: true, email: true, createdAt: true } },
        factures: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!org) return res.status(404).json({ error: 'Entreprise introuvable' });

    const admins = org.users.filter((u) => u.role === 'ADMIN');
    const techniciens = org.users.filter((u) => u.role === 'COMMERCIAL');

    res.json({
      id: org.id,
      nom: org.nom,
      statut: org.statut,
      plan: org.plan,
      admins,
      techniciens,
      factures: org.factures,
      createdAt: org.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le pack d'une entreprise (upgrade / downgrade)
// Ne modifie que la référence au pack : les techniciens déjà créés restent actifs
// (même au-delà de la nouvelle limite, ils ne sont jamais supprimés — seul l'ajout
// de nouveaux techniciens sera bloqué si la limite est dépassée).
router.patch('/organisations/:id/plan', async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Pack introuvable' });

    const organisation = await prisma.organisation.update({
      where: { id: req.params.id },
      data: { planId },
      include: { plan: true },
    });
    res.json(organisation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suspendre / réactiver une entreprise (bride immédiatement l'accès de tous ses comptes)
router.patch('/organisations/:id/statut', async (req, res) => {
  try {
    const { statut } = req.body; // 'ACTIF' ou 'SUSPENDU'
    if (!['ACTIF', 'SUSPENDU'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    // Change uniquement ce champ : aucune donnée (clients, RDV, techniciens, factures)
    // n'est touchée. Réactiver rend immédiatement accès à tout, tel quel.
    const organisation = await prisma.organisation.update({
      where: { id: req.params.id },
      data: { statut },
    });
    res.json(organisation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ----- FACTURES -----

// Historique de facturation d'une entreprise
router.get('/organisations/:id/factures', async (req, res) => {
  const factures = await prisma.facture.findMany({
    where: { organisationId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(factures);
});

// Générer une nouvelle facture (ex : le mois suivant), montant = prix du pack actuel
// Le mois est déterminé automatiquement (mois en cours) sauf si "periode" est fourni.
router.post('/organisations/:id/factures', async (req, res) => {
  try {
    const { periode, montant, dateEcheance } = req.body;
    const org = await prisma.organisation.findUnique({ where: { id: req.params.id }, include: { plan: true } });
    if (!org) return res.status(404).json({ error: 'Entreprise introuvable' });

    const facture = await prisma.facture.create({
      data: {
        numero: await genererNumeroFacture(),
        organisationId: req.params.id,
        montant: montant || org.plan.prixMensuel,
        periode: periode || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        dateEcheance: dateEcheance ? new Date(dateEcheance) : new Date(new Date().setDate(new Date().getDate() + 14)),
      },
    });
    res.status(201).json(facture);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une facture générée par erreur
router.delete('/factures/:id', async (req, res) => {
  try {
    await prisma.facture.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'Facture introuvable' });
  }
});

// Télécharger / consulter le PDF de la facture
router.get('/factures/:id/pdf', async (req, res) => {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: req.params.id },
      include: { organisation: true },
    });
    if (!facture) return res.status(404).json({ error: 'Facture introuvable' });

    const pdfBuffer = await genererFacturePdf(facture, facture.organisation);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="facture-${facture.numero}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer la facture par email (à l'admin de l'entreprise par défaut, ou à une adresse choisie)
router.post('/factures/:id/envoyer', async (req, res) => {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: req.params.id },
      include: { organisation: { include: { users: { where: { role: 'ADMIN' } } } } },
    });
    if (!facture) return res.status(404).json({ error: 'Facture introuvable' });

    const destinataire = req.body.email || facture.organisation.users[0]?.email;
    if (!destinataire) return res.status(400).json({ error: 'Aucune adresse email disponible pour cette entreprise' });

    const pdfBuffer = await genererFacturePdf(facture, facture.organisation);
    await envoyerFactureParEmail({ to: destinataire, facture, organisation: facture.organisation, pdfBuffer });

    const updated = await prisma.facture.update({
      where: { id: req.params.id },
      data: { envoyeeLe: new Date(), envoyeeA: destinataire },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'SMTP_NON_CONFIGURE') {
      return res.status(503).json({
        error: 'SMTP_NON_CONFIGURE',
        message: "L'envoi d'email n'est pas encore configuré côté serveur (variables SMTP_* manquantes dans .env).",
      });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer une facture comme payée / impayée
router.patch('/factures/:id', async (req, res) => {
  try {
    const { statut } = req.body; // 'PAYEE' ou 'IMPAYEE'
    if (!['PAYEE', 'IMPAYEE'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    const facture = await prisma.facture.update({
      where: { id: req.params.id },
      data: { statut, datePaiement: statut === 'PAYEE' ? new Date() : null },
    });
    res.json(facture);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
