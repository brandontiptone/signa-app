const express = require('express');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(notifs);
});

router.patch('/:id/read', async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { lu: true },
  });
  res.json({ ok: true });
});

module.exports = router;
