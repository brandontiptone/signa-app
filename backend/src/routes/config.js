const express = require('express');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Config de l'organisation en LECTURE SEULE, accessible à tous les rôles
// (le technicien en a besoin pour afficher le bon vocabulaire et le bon formulaire de visite)
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.organisationId) return res.status(404).json({ error: 'Pas d\'organisation' });

    const [organisation, resultats, champs] = await Promise.all([
      prisma.organisation.findUnique({
        where: { id: user.organisationId },
        select: { labelVisite: true },
      }),
      prisma.resultatOption.findMany({
        where: { organisationId: user.organisationId },
        orderBy: { ordre: 'asc' },
      }),
      prisma.champPersonnalise.findMany({
        where: { organisationId: user.organisationId },
        orderBy: { ordre: 'asc' },
      }),
    ]);

    res.json({ labelVisite: organisation.labelVisite, resultats, champs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
