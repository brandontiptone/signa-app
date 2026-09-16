const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');

const router = express.Router();

// ⚠️ Il n'y a plus d'auto-inscription publique. Dans ce modèle en location,
// les comptes sont toujours créés par quelqu'un d'habilité :
// - le Super Admin crée une entreprise cliente + son premier compte ADMIN
//   (POST /api/superadmin/organisations)
// - un ADMIN crée les comptes techniciens de son équipe, bridés par son pack
//   (POST /api/admin/commerciaux)
// Seule la connexion reste publique.

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { organisation: { include: { plan: true } } } });
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    if (user.role !== 'SUPER_ADMIN' && user.organisation?.statut === 'SUSPENDU') {
      return res.status(403).json({
        error: 'ORGANISATION_SUSPENDUE',
        message: "L'accès de votre entreprise à l'application a été suspendu. Contactez votre fournisseur.",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role,
        organisation: user.organisation ? { nom: user.organisation.nom, plan: user.organisation.plan.nom } : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
