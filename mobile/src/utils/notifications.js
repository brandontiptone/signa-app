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

// Demande la permission, récupère le token Expo Push et l'enregistre côté back-end
export async function registerForPushNotifications() {
  if (!Device.isDevice) return null; // les notifications push ne marchent pas sur simulateur

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  // projectId requis par Expo pour générer le push token (visible dans app.json > extra.eas.projectId
  // une fois que tu as lancé `eas build:configure`)
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = tokenData.data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    await client.patch('/users/push-token', { token });
  } catch (err) {
    console.log('Erreur enregistrement push token', err);
  }

  return token;
}
