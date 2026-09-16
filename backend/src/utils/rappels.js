const prisma = require('./db');
const { envoyerSms } = require('./sms');

// Programme les rappels SMS pour un RDV, selon les délais choisis par l'entreprise
// (ex : rappelDelaisH = [1, 3, 24]). Ignore les délais déjà dépassés
// (ex : RDV créé pour dans 2h → pas de rappel "24h avant" programmé).
async function programmerRappels(rdv, organisation) {
  if (!organisation.rappelSmsActif || organisation.rappelDelaisH.length === 0) return;

  const maintenant = new Date();
  const rappelsACreer = organisation.rappelDelaisH
    .map((delai) => {
      const envoyerA = new Date(rdv.dateHeure.getTime() - delai * 60 * 60 * 1000);
      return { delai, envoyerA };
    })
    .filter(({ envoyerA }) => envoyerA > maintenant);

  if (rappelsACreer.length === 0) return;

  await prisma.rappelSms.createMany({
    data: rappelsACreer.map(({ delai, envoyerA }) => ({
      rdvId: rdv.id,
      delaiHeures: delai,
      envoyerA,
    })),
  });
}

// Annule les rappels non encore envoyés (ex : si le RDV est annulé ou déplacé)
async function annulerRappels(rdvId) {
  await prisma.rappelSms.updateMany({
    where: { rdvId, statut: 'EN_ATTENTE' },
    data: { statut: 'ANNULE' },
  });
}

function formatMessage(rdv) {
  const heure = rdv.dateHeure.toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  return `Bonjour ${rdv.client.prenom}, rappel de votre rendez-vous avec ${rdv.commercial.prenom} ${rdv.commercial.nom} le ${heure}${rdv.adresse ? ' — ' + rdv.adresse : ''}.`;
}

// À appeler périodiquement (voir src/scheduler.js) : envoie tous les rappels dus
async function traiterRappelsDus() {
  const maintenant = new Date();
  const rappels = await prisma.rappelSms.findMany({
    where: { statut: 'EN_ATTENTE', envoyerA: { lte: maintenant } },
    include: { rdv: { include: { client: true, commercial: true } } },
    take: 50, // par lot, pour ne pas surcharger si beaucoup de rappels s'accumulent
  });

  for (const rappel of rappels) {
    if (!rappel.rdv.client.telephone) {
      await prisma.rappelSms.update({ where: { id: rappel.id }, data: { statut: 'ECHEC' } });
      continue;
    }
    try {
      await envoyerSms(rappel.rdv.client.telephone, formatMessage(rappel.rdv));
      await prisma.rappelSms.update({
        where: { id: rappel.id },
        data: { statut: 'ENVOYE', envoyeLe: new Date() },
      });
    } catch (err) {
      console.error('Erreur envoi rappel SMS', rappel.id, err.message);
      await prisma.rappelSms.update({ where: { id: rappel.id }, data: { statut: 'ECHEC' } });
    }
  }

  return rappels.length;
}

module.exports = { programmerRappels, annulerRappels, traiterRappelsDus };
