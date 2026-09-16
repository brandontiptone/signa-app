// Envoi de SMS via Twilio (standard du marché, fonctionne en France).
// Configuration via variables d'environnement — voir .env.example.
let twilioClient = null;

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  if (!twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

async function envoyerSms(to, message) {
  const client = getClient();
  if (!client) {
    const err = new Error('SMS_NON_CONFIGURE');
    err.code = 'SMS_NON_CONFIGURE';
    throw err;
  }
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM_NUMBER,
    to,
  });
}

module.exports = { envoyerSms };
