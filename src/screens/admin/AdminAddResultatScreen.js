import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import client from '../../api/client';
import FormError from '../../components/FormError';

export default function AdminAddResultatScreen({ navigation }) {
  const [label, setLabel] = useState('');
  const [estPositif, setEstPositif] = useState(true);
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  const creer = async () => {
    setBanner('');
    if (!label.trim()) {
      setBanner('Le libellé est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      await client.post('/parametres/resultats', { label, estPositif });
      navigation.goBack();
    } catch (err) {
      setBanner(err?.response?.data?.error || "La création a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FormError message={banner} variant="banner" />

      <Text style={styles.label}>Libellé</Text>
      <TextInput style={styles.input} placeholder='Ex : "Réparé", "À recontacter"...' value={label} onChangeText={setLabel} />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Ce résultat compte comme un succès</Text>
        <Switch value={estPositif} onValueChange={setEstPositif} trackColor={{ true: '#1F9D6B' }} />
      </View>
      <Text style={styles.hint}>Détermine s'il est comptabilisé dans le "taux de réussite" des statistiques.</Text>

      <TouchableOpacity style={styles.button} onPress={creer} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Création...' : 'Ajouter ce résultat'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8fa', borderRadius: 12, padding: 14 },
  switchLabel: { fontSize: 13.5, fontWeight: '600', color: '#1a1a2e', flex: 1, marginRight: 10 },
  hint: { fontSize: 11, color: '#999', marginTop: 8, marginBottom: 20, lineHeight: 16 },
  button: { backgroundColor: '#FF6B4A', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
