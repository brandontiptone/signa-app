const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const { sendPushNotification } = require('../utils/push');
const { programmerRappels } = require('../utils/rappels');

const router = express.Router();
router.use(auth, requireAdmin);
// req.user est rempli par requireAdmin : toutes les requêtes ci-dessous sont
// strictement filtrées par req.user.organisationId pour qu'une entreprise
// cliente ne voie jamais les données d'une autre.

// ----- ÉQUIPE (techniciens / commerciaux) -----

// Liste des techniciens de mon organisation + info sur le pack (utilisé / max)
router.get('/commerciaux', async (req, res) => {
  const organisation = await prisma.organisation.findUnique({
    where: { id: req.user.organisationId },
    include: { plan: true },
  });
  const commerciaux = await prisma.user.findMany({
    where: { role: 'COMMERCIAL', organisationId: req.user.organisationId },
    select: { id: true, nom: true, prenom: true, email: true, telephone: true, createdAt: true },
    orderBy: { nom: 'asc' },
  });
  res.json({
    commerciaux,
    pack: {
      nom: organisation.plan.nom,
      max: organisation.plan.maxTechniciens,
      utilises: commerciaux.length,
    },
  });
});

// Créer un compte technicien — bloqué si le pack de l'entreprise est atteint
router.post('/commerciaux', async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone } = req.body;
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const organisation = await prisma.organisation.findUnique({
      where: { id: req.user.organisationId },
      include: { plan: true },
    });
    const nbActuel = await prisma.user.count({
      where: { role: 'COMMERCIAL', organisationId: req.user.organisationId },
    });

    if (organisation.plan.maxTechniciens !== null && nbActuel >= organisation.plan.maxTechniciens) {
      return res.status(403).json({
        error: 'LIMITE_PACK_ATTEINTE',
        message: `Ton pack "${organisation.plan.nom}" est limité à ${organisation.plan.maxTechniciens} technicien(s). Passe à un pack supérieur pour en ajouter davantage.`,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const technicien = await prisma.user.create({
      data: {
        nom, prenom, email, telephone,
        password: hash,
        role: 'COMMERCIAL',
        organisationId: req.user.organisationId,
      },
      select: { id: true, nom: true, prenom: true, email: true, telephone: true },
    });
    res.status(201).json(technicien);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Retirer un technicien (libère une place sur le pack)
router.delete('/commerciaux/:id', async (req, res) => {
  const result = await prisma.user.deleteMany({
    where: { id: req.params.id, role: 'COMMERCIAL', organisationId: req.user.organisationId },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Technicien introuvable' });
  res.json({ ok: true });
});

// ----- RDV & CLIENTS (scopés à l'organisation) -----

router.get('/rdv', async (req, res) => {
  const { commercialId, from, to } = req.query;
  const where = { commercial: { organisationId: req.user.organisationId } };
  if (commercialId) where.commercialId = commercialId;
  if (from && to) where.dateHeure = { gte: new Date(from), lte: new Date(to) };

  const rdvs = await prisma.rdv.findMany({
    where,
    include: { client: true, commercial: { select: { id: true, nom: true, prenom: true } }, resultat: true },
    orderBy: { dateHeure: 'asc' },
  });
  res.json(rdvs);
});

router.get('/clients', async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { organisationId: req.user.organisationId },
    include: { commercial: { select: { id: true, nom: true, prenom: true } } },
    orderBy: { nom: 'asc' },
  });
  res.json(clients);
});

router.post('/clients', async (req, res) => {
  const { nom, prenom, telephone, email, adresse, commercialId } = req.body;
  if (!commercialId) return res.status(400).json({ error: 'commercialId requis' });

  // Vérifie que le commercial choisi appartient bien à mon organisation
  const commercial = await prisma.user.findFirst({
    where: { id: commercialId, organisationId: req.user.organisationId, role: 'COMMERCIAL' },
  });
  if (!commercial) return res.status(404).json({ error: 'Technicien introuvable dans ton organisation' });

  const client = await prisma.client.create({
    data: { nom, prenom, telephone, email, adresse, commercialId, organisationId: req.user.organisationId },
  });
  res.status(201).json(client);
});

router.post('/rdv', async (req, res) => {
  try {
    const { clientId, commercialId, dateHeure, adresse, notes } = req.body;
    if (!clientId || !commercialId || !dateHeure) {
      return res.status(400).json({ error: 'clientId, commercialId et dateHeure sont requis' });
    }

    const commercial = await prisma.user.findFirst({
      where: { id: commercialId, organisationId: req.user.organisationId, role: 'COMMERCIAL' },
    });
    if (!commercial) return res.status(404).json({ error: 'Technicien introuvable dans ton organisation' });

    const rdv = await prisma.rdv.create({
      data: { clientId, commercialId, dateHeure: new Date(dateHeure), adresse, notes },
      include: { client: true, commercial: true },
    });

    const organisation = await prisma.organisation.findUnique({ where: { id: req.user.organisationId } });
    await programmerRappels(rdv, organisation);

    const message = `RDV avec ${rdv.client.prenom} ${rdv.client.nom} le ${new Date(dateHeure).toLocaleString('fr-FR')}`;

    await prisma.notification.create({
      data: { userId: commercialId, titre: 'Nouveau RDV attribué', message, type: 'NOUVEAU_RDV' },
    });

    if (rdv.commercial.pushToken) {
      await sendPushNotification(rdv.commercial.pushToken, {
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

// Statistiques de mon organisation, par commercial — basées sur les résultats
// configurables de l'entreprise (le "taux de réussite" regroupe tous les
// résultats marqués comme positifs, quel que soit leur libellé)
router.get('/stats', async (req, res) => {
  const commerciaux = await prisma.user.findMany({
    where: { role: 'COMMERCIAL', organisationId: req.user.organisationId },
  });
  const result = await Promise.all(
    commerciaux.map(async (c) => {
      const termines = await prisma.rdv.findMany({
        where: { commercialId: c.id, statut: 'TERMINE' },
        include: { resultat: true },
      });
      const positifs = termines.filter((r) => r.resultat?.estPositif).length;
      const total = termines.length;
      return {
        commercialId: c.id, nom: c.nom, prenom: c.prenom,
        signes: positifs, nonSignes: total - positifs, total,
        pourcentageSigne: total > 0 ? Math.round((positifs / total) * 100) : 0,
      };
    })
  );
  res.json(result);
});

module.exports = router;
