const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;

    // Un ADMIN ou un COMMERCIAL dont l'organisation a été suspendue (impayé, pack résilié...)
    // perd immédiatement l'accès à l'API, où qu'il soit dans l'app.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organisation: true },
    });
    if (!user) return res.status(401).json({ error: 'Compte introuvable' });

    if (user.role !== 'SUPER_ADMIN' && user.organisation?.statut === 'SUSPENDU') {
      return res.status(403).json({
        error: 'ORGANISATION_SUSPENDUE',
        message: "L'accès de votre entreprise à l'application a été suspendu. Contactez votre fournisseur.",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

module.exports = authMiddleware;
