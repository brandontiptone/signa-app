require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const rdvRoutes = require('./routes/rdv');
const clientsRoutes = require('./routes/clients');
const documentsRoutes = require('./routes/documents');
const notificationsRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');
const parametresRoutes = require('./routes/parametres');
const configRoutes = require('./routes/config');
const { demarrerScheduler } = require('./scheduler');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/rdv', rdvRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/parametres', parametresRoutes);
app.use('/api/config', configRoutes);

app.get('/', (req, res) => res.json({ status: 'API Signa en ligne' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  if (!process.env.CLOUDINARY_URL) {
    console.warn('⚠️  CLOUDINARY_URL non configuré — les fichiers uploadés sont stockés localement (À NE PAS FAIRE EN PRODUCTION, voir DEPLOIEMENT.md)');
  }
  demarrerScheduler();
});
