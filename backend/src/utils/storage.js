// Stockage des fichiers uploadés (photos/documents des visites).
// En production, utilise Cloudinary (gratuit jusqu'à 25 Go, persistant, CDN inclus)
// si CLOUDINARY_URL est configuré. Sinon, retombe sur le disque local — pratique
// pour développer en local, mais À NE JAMAIS UTILISER EN PRODUCTION : la plupart
// des hébergeurs (Railway, Render...) ont un système de fichiers non persistant,
// tout serait perdu au prochain redéploiement.
const path = require('path');
const fs = require('fs');

const cloudinaryConfigured = !!process.env.CLOUDINARY_URL;
let cloudinary = null;
if (cloudinaryConfigured) {
  cloudinary = require('cloudinary').v2; // lit CLOUDINARY_URL automatiquement depuis l'env
}

async function sauvegarderFichier(file) {
  if (cloudinaryConfigured) {
    const resultat = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'signa-documents', resource_type: 'auto' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(file.buffer);
    });
    return resultat.secure_url;
  }

  // Fallback local (dev uniquement)
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

module.exports = { sauvegarderFichier, cloudinaryConfigured };
