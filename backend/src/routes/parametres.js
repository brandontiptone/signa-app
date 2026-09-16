const express = require('express');
const prisma = require('../utils/db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();
router.use(auth, requireAdmin);
// Tout ce fichier est scopé à req.user.organisationId : chaque entreprise cliente
// configure son propre vocabulaire, ses résultats et ses champs, indépendamment des autres.

// ----- PARAMÈTRES GÉNÉRAUX (vocabulaire + rappels SMS) -----

router.get('/', async (req, res) => {
  const org = await prisma.organisation.findUnique({
    where: { id: req.user.organisationId },
    select: { labelVisite: true, rappelSmsActif: true, rappelDelaisH: true },
  });
  res.json(org);
});

router.patch('/', async (req, res) => {
  try {
    const { labelVisite, rappelSmsActif, rappelDelaisH } = req.body;
    const data = {};
    if (labelVisite !== undefined) {
      if (!labelVisite.trim()) return res.status(400).json({ error: 'Le libellé ne peut pas être vide' });
      data.labelVisite = labelVisite.trim();
    }
    if (rappelSmsActif !== undefined) data.rappelSmsActif = !!rappelSmsActif;
    if (rappelDelaisH !== undefined) {
      const valides = [1, 3, 24];
      if (!Array.isArray(rappelDelaisH) || rappelDelaisH.some((d) => !valides.includes(d))) {
        return res.status(400).json({ error: 'Délais invalides — choisis parmi 1h, 3h, 24h' });
      }
      data.rappelDelaisH = rappelDelaisH;
    }
    const org = await prisma.organisation.update({ where: { id: req.user.organisationId }, data });
    res.json(org);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ----- OPTIONS DE RÉSULTAT (remplace le binaire "signé / non signé") -----

router.get('/resultats', async (req, res) => {
  const resultats = await prisma.resultatOption.findMany({
    where: { organisationId: req.user.organisationId },
    orderBy: { ordre: 'asc' },
  });
  res.json(resultats);
});

router.post('/resultats', async (req, res) => {
  const { label, estPositif } = req.body;
  if (!label?.trim()) return res.status(400).json({ error: 'Le libellé est obligatoire' });
  const count = await prisma.resultatOption.count({ where: { organisationId: req.user.organisationId } });
  const resultat = await prisma.resultatOption.create({
    data: { organisationId: req.user.organisationId, label: label.trim(), estPositif: !!estPositif, ordre: count },
  });
  res.status(201).json(resultat);
});

router.patch('/resultats/:id', async (req, res) => {
  const { label, estPositif, ordre } = req.body;
  const data = {};
  if (label !== undefined) data.label = label.trim();
  if (estPositif !== undefined) data.estPositif = !!estPositif;
  if (ordre !== undefined) data.ordre = ordre;
  const result = await prisma.resultatOption.updateMany({
    where: { id: req.params.id, organisationId: req.user.organisationId },
    data,
  });
  if (result.count === 0) return res.status(404).json({ error: 'Introuvable' });
  res.json({ ok: true });
});

router.delete('/resultats/:id', async (req, res) => {
  const result = await prisma.resultatOption.deleteMany({
    where: { id: req.params.id, organisationId: req.user.organisationId },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Introuvable' });
  res.json({ ok: true });
});

// ----- CHAMPS PERSONNALISÉS DU FORMULAIRE DE VISITE -----

router.get('/champs', async (req, res) => {
  const champs = await prisma.champPersonnalise.findMany({
    where: { organisationId: req.user.organisationId },
    orderBy: { ordre: 'asc' },
  });
  res.json(champs);
});

router.post('/champs', async (req, res) => {
  const { label, type, options, obligatoire } = req.body;
  if (!label?.trim()) return res.status(400).json({ error: 'Le libellé est obligatoire' });
  const typesValides = ['TEXTE', 'NOMBRE', 'ZONE_TEXTE', 'CHOIX', 'CASE_A_COCHER'];
  if (!typesValides.includes(type)) return res.status(400).json({ error: 'Type de champ invalide' });
  if (type === 'CHOIX' && (!Array.isArray(options) || options.length < 2)) {
    return res.status(400).json({ error: 'Un champ à choix doit avoir au moins 2 options' });
  }

  const count = await prisma.champPersonnalise.count({ where: { organisationId: req.user.organisationId } });
  const champ = await prisma.champPersonnalise.create({
    data: {
      organisationId: req.user.organisationId,
      label: label.trim(),
      type,
      options: type === 'CHOIX' ? options : [],
      obligatoire: !!obligatoire,
      ordre: count,
    },
  });
  res.status(201).json(champ);
});

router.patch('/champs/:id', async (req, res) => {
  const { label, options, obligatoire, ordre } = req.body;
  const data = {};
  if (label !== undefined) data.label = label.trim();
  if (options !== undefined) data.options = options;
  if (obligatoire !== undefined) data.obligatoire = !!obligatoire;
  if (ordre !== undefined) data.ordre = ordre;
  const result = await prisma.champPersonnalise.updateMany({
    where: { id: req.params.id, organisationId: req.user.organisationId },
    data,
  });
  if (result.count === 0) return res.status(404).json({ error: 'Introuvable' });
  res.json({ ok: true });
});

router.delete('/champs/:id', async (req, res) => {
  const result = await prisma.champPersonnalise.deleteMany({
    where: { id: req.params.id, organisationId: req.user.organisationId },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Introuvable' });
  res.json({ ok: true });
});

module.exports = router;
