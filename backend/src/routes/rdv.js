const express = require('express');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');
const { sendPushNotification } = require('../utils/push');
const { programmerRappels, annulerRappels } = require('../utils/rappels');

const router = express.Router();
router.use(auth);

// Liste des RDV du commercial connecté (filtrable par semaine)
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { commercialId: req.userId };
    if (from && to) where.dateHeure = { gte: new Date(from), lte: new Date(to) };
    const rdvs = await prisma.rdv.findMany({
      where,
      include: { client: true, resultat: true },
      orderBy: { dateHeure: 'asc' },
    });
    res.json(rdvs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détail d'un RDV
router.get('/:id', async (req, res) => {
  try {
    const rdv = await prisma.rdv.findFirst({
      where: { id: req.params.id, commercialId: req.userId },
      include: {
        client: true,
        documents: true,
        resultat: true,
        reponses: { include: { champ: true } },
      },
    });
    if (!rdv) return res.status(404).json({ error: 'RDV introuvable' });
    res.json(rdv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Création d'un RDV (planification) — programme aussi les rappels SMS si activés
router.post('/', async (req, res) => {
  try {
    const { clientId, dateHeure, adresse, notes } = req.body;
    const commercial = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { organisation: true },
    });

    const rdv = await prisma.rdv.create({
      data: { clientId, commercialId: req.userId, dateHeure: new Date(dateHeure), adresse, notes },
      include: { client: true },
    });

    if (commercial.organisation) {
      await programmerRappels(rdv, commercial.organisation);
    }

    const message = `RDV avec ${rdv.client.prenom} ${rdv.client.nom} le ${new Date(dateHeure).toLocaleString('fr-FR')}`;
    await prisma.notification.create({
      data: { userId: req.userId, titre: 'Nouveau RDV attribué', message, type: 'NOUVEAU_RDV' },
    });
    if (commercial?.pushToken) {
      await sendPushNotification(commercial.pushToken, {
        title: 'Nouveau RDV attribué',
        body: message,
        data: { rdvId: rdv.id, type: 'NOUVEAU_RDV' },
      });
    }

    res.status(201).json(rdv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrer la visite
router.patch('/:id/start', async (req, res) => {
  try {
    const rdv = await prisma.rdv.updateMany({
      where: { id: req.params.id, commercialId: req.userId },
      data: { statut: 'EN_COURS' },
    });
    if (rdv.count === 0) return res.status(404).json({ error: 'RDV introuvable' });
    const updated = await prisma.rdv.findUnique({ where: { id: req.params.id }, include: { client: true } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Annuler un RDV — annule aussi ses rappels SMS non encore envoyés
router.patch('/:id/cancel', async (req, res) => {
  try {
    const rdv = await prisma.rdv.updateMany({
      where: { id: req.params.id, commercialId: req.userId },
      data: { statut: 'ANNULE' },
    });
    if (rdv.count === 0) return res.status(404).json({ error: 'RDV introuvable' });
    await annulerRappels(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Enregistrer / mettre à jour la note du technicien à tout moment pendant la visite
router.patch('/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;
    const rdv = await prisma.rdv.updateMany({
      where: { id: req.params.id, commercialId: req.userId },
      data: { notes },
    });
    if (rdv.count === 0) return res.status(404).json({ error: 'RDV introuvable' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Enregistrer les réponses aux champs personnalisés du formulaire de visite
// (envoie l'intégralité des réponses à chaque appel — upsert par champ)
router.post('/:id/reponses', async (req, res) => {
  try {
    const { reponses } = req.body; // [{ champId, valeur }]
    const rdv = await prisma.rdv.findFirst({ where: { id: req.params.id, commercialId: req.userId } });
    if (!rdv) return res.status(404).json({ error: 'RDV introuvable' });

    await Promise.all(
      (reponses || []).map(({ champId, valeur }) =>
        prisma.reponseChamp.upsert({
          where: { rdvId_champId: { rdvId: rdv.id, champId } },
          update: { valeur: String(valeur) },
          create: { rdvId: rdv.id, champId, valeur: String(valeur) },
        })
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Finaliser la visite avec le résultat choisi (configurable par l'entreprise)
router.patch('/:id/finalize', async (req, res) => {
  try {
    const { resultatId, notes } = req.body;
    if (!resultatId) return res.status(400).json({ error: 'resultatId requis' });

    const commercial = await prisma.user.findUnique({ where: { id: req.userId } });
    const resultat = await prisma.resultatOption.findFirst({
      where: { id: resultatId, organisationId: commercial.organisationId },
    });
    if (!resultat) return res.status(400).json({ error: 'Résultat invalide pour ton organisation' });

    // Vérifie que les champs obligatoires ont bien une réponse enregistrée
    const champsObligatoires = await prisma.champPersonnalise.findMany({
      where: { organisationId: commercial.organisationId, obligatoire: true },
    });
    if (champsObligatoires.length > 0) {
      const reponsesExistantes = await prisma.reponseChamp.findMany({
        where: { rdvId: req.params.id, champId: { in: champsObligatoires.map((c) => c.id) } },
      });
      const manquants = champsObligatoires.filter(
        (c) => !reponsesExistantes.find((r) => r.champId === c.id && r.valeur.trim() !== '')
      );
      if (manquants.length > 0) {
        return res.status(400).json({
          error: 'CHAMPS_OBLIGATOIRES_MANQUANTS',
          message: `Champ(s) obligatoire(s) manquant(s) : ${manquants.map((c) => c.label).join(', ')}`,
          champs: manquants.map((c) => c.id),
        });
      }
    }

    const rdv = await prisma.rdv.updateMany({
      where: { id: req.params.id, commercialId: req.userId },
      data: { statut: 'TERMINE', resultatId, notes },
    });
    if (rdv.count === 0) return res.status(404).json({ error: 'RDV introuvable' });

    const updated = await prisma.rdv.findUnique({
      where: { id: req.params.id },
      include: { client: true, documents: true, commercial: true, resultat: true },
    });

    // Notifie les admins DE LA MÊME ORGANISATION avec le résultat de la visite
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', organisationId: commercial.organisationId },
    });
    const message = `${updated.commercial.prenom} ${updated.commercial.nom} a finalisé la visite de ${updated.client.prenom} ${updated.client.nom} — ${updated.resultat.label}`;

    await Promise.all(
      admins.map(async (admin) => {
        await prisma.notification.create({
          data: { userId: admin.id, titre: 'Visite finalisée', message, type: 'VISITE_FINALISEE' },
        });
        if (admin.pushToken) {
          await sendPushNotification(admin.pushToken, {
            title: `${updated.resultat.label} — ${updated.client.prenom} ${updated.client.nom}`,
            body: message,
            data: { clientId: updated.clientId, rdvId: updated.id, type: 'VISITE_FINALISEE' },
          });
        }
      })
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
