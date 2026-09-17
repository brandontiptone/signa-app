import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import client from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Demande la permission, récupère le token Expo Push et l'enregistre côté back-end.
// Ne fait jamais planter l'app : tant que le projectId EAS n'est pas configuré
// (voir app.json), les notifications sont simplement désactivées en silence.
export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) return null; // les notifications push ne marchent pas sur simulateur

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    // projectId requis par Expo pour générer le push token (visible dans app.json > extra.eas.projectId
    // une fois que tu as lancé `eas build:configure`). Tant qu'il n'est pas configuré
    // (placeholder par défaut), on n'essaie même pas — ça évite une erreur au démarrage.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const projectIdValide = projectId && projectId !== 'REMPLACE_PAR_TON_PROJECT_ID_EAS';
    if (!projectIdValide) {
      console.log('Notifications push désactivées : projectId EAS non configuré dans app.json');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    await client.patch('/users/push-token', { token });
    return token;
  } catch (err) {
    console.log('Notifications push indisponibles pour le moment', err?.message);
    return null;
  }
}
