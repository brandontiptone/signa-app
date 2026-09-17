import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import client from '../../api/client';
import FormError from '../../components/FormError';

const TYPES = [
  { value: 'TEXTE', label: 'Texte court' },
  { value: 'ZONE_TEXTE', label: 'Texte long' },
  { value: 'NOMBRE', label: 'Nombre' },
  { value: 'CHOIX', label: 'Liste de choix' },
  { value: 'CASE_A_COCHER', label: 'Case à cocher' },
];

export default function AdminAddChampScreen({ navigation }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('TEXTE');
  const [optionsText, setOptionsText] = useState(''); // séparées par des virgules
  const [obligatoire, setObligatoire] = useState(false);
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  const creer = async () => {
    setBanner('');
    if (!label.trim()) {
      setBanner('Le libellé du champ est obligatoire.');
      return;
    }
    const options = optionsText.split(',').map((o) => o.trim()).filter(Boolean);
    if (type === 'CHOIX' && options.length < 2) {
      setBanner('Un champ à choix doit avoir au moins 2 options, séparées par des virgules.');
      return;
    }
    setLoading(true);
    try {
      await client.post('/parametres/champs', { label, type, options, obligatoire });
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

      <Text style={styles.label}>Libellé du champ</Text>
      <TextInput style={styles.input} placeholder="Ex : Type d'installation" value={label} onChangeText={setLabel} />

      <Text style={styles.label}>Type de champ</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t.value} style={[styles.typeChip, type === t.value && styles.typeChipActive]} onPress={() => setType(t.value)}>
            <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'CHOIX' && (
        <>
          <Text style={styles.label}>Options (séparées par des virgules)</Text>
          <TextInput style={styles.input} placeholder="Ex : Neuf, Rénovation, Urgence" value={optionsText} onChangeText={setOptionsText} />
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Champ obligatoire pour finaliser la visite</Text>
        <Switch value={obligatoire} onValueChange={setObligatoire} trackColor={{ true: '#FF6B4A' }} />
      </View>

      <TouchableOpacity style={styles.button} onPress={creer} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Création...' : 'Ajouter ce champ'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  typeChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: '#f0f0f0' },
  typeChipActive: { backgroundColor: '#FF6B4A' },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#555' },
  typeChipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8fa', borderRadius: 12, padding: 14, marginTop: 6, marginBottom: 20 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', flex: 1, marginRight: 10 },
  button: { backgroundColor: '#FF6B4A', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
