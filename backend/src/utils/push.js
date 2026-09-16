// Envoi de notifications push via l'API Expo (aucune dépendance externe nécessaire)
// Doc: https://docs.expo.dev/push-notifications/sending-notifications/

async function sendPushNotification(pushToken, { title, body, data }) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
      }),
    });
  } catch (err) {
    console.error('Erreur envoi push notification', err);
  }
}

module.exports = { sendPushNotification };
