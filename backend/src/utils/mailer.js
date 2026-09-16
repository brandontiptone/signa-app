const nodemailer = require('nodemailer');

// Configuration via variables d'environnement (voir .env.example).
// Fonctionne avec n'importe quel fournisseur SMTP (Gmail, SendGrid, OVH, Brevo...).
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function envoyerFactureParEmail({ to, facture, organisation, pdfBuffer }) {
  const transporter = getTransporter();
  if (!transporter) {
    const err = new Error('SMTP_NON_CONFIGURE');
    err.code = 'SMTP_NON_CONFIGURE';
    throw err;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Signa <factures@signa.app>',
    to,
    subject: `Votre facture Signa — ${facture.periode}`,
    text: `Bonjour,\n\nVoici votre facture Signa pour ${facture.periode}, d'un montant de ${facture.montant.toFixed(2)} €.\n\nMerci de votre confiance.\nL'équipe Signa`,
    attachments: [
      { filename: `facture-${facture.numero}.pdf`, content: pdfBuffer, contentType: 'application/pdf' },
    ],
  });
}

module.exports = { envoyerFactureParEmail };
