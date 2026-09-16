const express = require('express');
const multer = require('multer');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');
const { sauvegarderFichier } = require('../utils/storage');

const router = express.Router();
router.use(auth);

// En mémoire (pas sur disque) : le fichier part directement vers Cloudinary
// ou, en dev, est écrit sur disque par utils/storage.js
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// Upload d'une photo ou d'un document pour un RDV
router.post('/:rdvId', upload.single('file'), async (req, res) => {
  try {
    const rdv = await prisma.rdv.findFirst({
      where: { id: req.params.rdvId, commercialId: req.userId },
    });
    if (!rdv) return res.status(404).json({ error: 'RDV introuvable' });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    const url = await sauvegarderFichier(req.file);
    const type = req.body.type === 'PHOTO' ? 'PHOTO' : 'DOCUMENT';
    const doc = await prisma.document.create({
      data: { rdvId: rdv.id, type, url, nom: req.file.originalname },
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi du fichier" });
  }
});

module.exports = router;
