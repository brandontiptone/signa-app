const express = require('express');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const clients = await prisma.client.findMany({ where: { commercialId: req.userId } });
  res.json(clients);
});

router.post('/', async (req, res) => {
  const { nom, prenom, telephone, email, adresse } = req.body;
  const commercial = await prisma.user.findUnique({ where: { id: req.userId } });
  const client = await prisma.client.create({
    data: { nom, prenom, telephone, email, adresse, commercialId: req.userId, organisationId: commercial.organisationId },
  });
  res.status(201).json(client);
});

// Fiche client complète : coordonnées + historique de tous ses RDV/dossiers
// (accessible au commercial propriétaire du client, ou à un admin de la même organisation)
router.get('/:id', async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    const where = requester?.role === 'ADMIN'
      ? { id: req.params.id, organisationId: requester.organisationId }
      : { id: req.params.id, commercialId: req.userId };

    const client = await prisma.client.findFirst({
      where,
      include: {
        commercial: { select: { id: true, nom: true, prenom: true } },
        rdvs: {
          include: { documents: true, resultat: true },
          orderBy: { dateHeure: 'desc' },
        },
      },
    });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
