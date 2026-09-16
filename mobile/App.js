import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    // Quand l'utilisateur appuie sur une notification (RDV attribué), on l'emmène direct sur le détail
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { rdvId, clientId, type } = response.notification.request.content.data || {};
      if (!navigationRef.current) return;
      if (type === 'ETUDE_FINALISEE' && clientId) {
        navigationRef.current.navigate('ClientDetail', { clientId });
      } else if (rdvId) {
        navigationRef.current.navigate('RdvDetail', { rdvId });
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
