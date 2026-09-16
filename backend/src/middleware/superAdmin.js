const prisma = require('../utils/db');

async function requireSuperAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Accès réservé au super administrateur' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = requireSuperAdmin;
