const { traiterRappelsDus } = require('./utils/rappels');

const INTERVALLE_MS = 5 * 60 * 1000; // toutes les 5 minutes

function demarrerScheduler() {
  const executer = async () => {
    try {
      const nb = await traiterRappelsDus();
      if (nb > 0) console.log(`[scheduler] ${nb} rappel(s) SMS traité(s)`);
    } catch (err) {
      console.error('[scheduler] erreur traitement des rappels', err);
    }
  };

  executer(); // premier passage au démarrage du serveur
  setInterval(executer, INTERVALLE_MS);
  console.log('[scheduler] rappels SMS actifs — vérification toutes les 5 minutes');
}

module.exports = { demarrerScheduler };
