const prisma = require('../utils/db');

// À utiliser APRÈS le middleware auth. Vérifie que l'utilisateur est ADMIN
// et attache l'utilisateur complet à req.user.
async function requireAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = requireAdmin;
