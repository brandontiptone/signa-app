const express = require('express');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Performance du commercial, basée sur les résultats configurables de son entreprise
router.get('/', async (req, res) => {
  const termines = await prisma.rdv.findMany({
    where: { commercialId: req.userId, statut: 'TERMINE' },
    include: { resultat: true },
  });
  const positifs = termines.filter((r) => r.resultat?.estPositif).length;
  const total = termines.length;
  res.json({
    signes: positifs,
    nonSignes: total - positifs,
    total,
    pourcentageSigne: total > 0 ? Math.round((positifs / total) * 100) : 0,
  });
});

module.exports = router;
