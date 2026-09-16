const express = require('express');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Profil de l'utilisateur connecté
router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role });
});

// Enregistrement du token push Expo (à appeler à la connexion / ouverture de l'app)
router.patch('/push-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token manquant' });
  await prisma.user.update({ where: { id: req.userId }, data: { pushToken: token } });
  res.json({ ok: true });
});

module.exports = router;
