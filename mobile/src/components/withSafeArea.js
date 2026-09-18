import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// Enveloppe un écran avec la marge de sécurité du haut (encoche/barre de statut),
// pour tous les écrans affichés SANS en-tête natif (dans un onglet, typiquement).
// Utilisé une seule fois dans la navigation plutôt que dans chaque écran.
export default function withSafeArea(ScreenComponent) {
  return function WrappedScreen(props) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenComponent {...props} />
      </SafeAreaView>
    );
  };
}
