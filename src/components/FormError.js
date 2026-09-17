import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Message d'erreur rouge réutilisable : sous un champ (variant="field")
// ou en bandeau au-dessus d'un formulaire (variant="banner")
export default function FormError({ message, variant = 'field' }) {
  if (!message) return null;

  if (variant === 'banner') {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>⚠️</Text>
        <Text style={styles.bannerText}>{message}</Text>
      </View>
    );
  }

  return <Text style={styles.fieldText}>{message}</Text>;
}

const styles = StyleSheet.create({
  fieldText: { color: '#DC2626', fontSize: 12, marginTop: -6, marginBottom: 10, marginLeft: 2, fontWeight: '600' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FDECEC', borderRadius: 10, padding: 12, marginBottom: 14, gap: 8 },
  bannerIcon: { fontSize: 14 },
  bannerText: { color: '#C0392B', fontSize: 12.5, fontWeight: '600', flex: 1, lineHeight: 17 },
});
