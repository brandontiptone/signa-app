import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import FormError from '../../components/FormError';
import { useAuth } from '../../context/AuthContext';

const DELAIS = [
  { value: 1, label: '1h avant' },
  { value: 3, label: '3h avant' },
  { value: 24, label: '24h avant' },
];

const TYPES_CHAMP = [
  { value: 'TEXTE', label: 'Texte court' },
  { value: 'ZONE_TEXTE', label: 'Texte long' },
  { value: 'NOMBRE', label: 'Nombre' },
  { value: 'CHOIX', label: 'Liste de choix' },
  { value: 'CASE_A_COCHER', label: 'Case à cocher' },
];

export default function AdminSettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [labelVisite, setLabelVisite] = useState('');
  const [rappelSmsActif, setRappelSmsActif] = useState(false);
  const [rappelDelaisH, setRappelDelaisH] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [champs, setChamps] = useState([]);
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [paramRes, resultatsRes, champsRes] = await Promise.all([
        client.get('/parametres'),
        client.get('/parametres/resultats'),
        client.get('/parametres/champs'),
      ]);
      setLabelVisite(paramRes.data.labelVisite);
      setRappelSmsActif(paramRes.data.rappelSmsActif);
      setRappelDelaisH(paramRes.data.rappelDelaisH);
      setResultats(resultatsRes.data);
      setChamps(champsRes.data);
    } catch (err) {
      console.log('Erreur chargement paramètres', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const toggleDelai = (value) => {
    setRappelDelaisH((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()));
  };

  const enregistrerGeneral = async () => {
    setBanner('');
    if (!labelVisite.trim()) {
      setBanner('Le libellé de la visite ne peut pas être vide.');
      return;
    }
    setSaving(true);
    try {
      await client.patch('/parametres', { labelVisite, rappelSmsActif, rappelDelaisH });
      Alert.alert('Enregistré', 'Tes paramètres ont été mis à jour.');
    } catch (err) {
      setBanner(err?.response?.data?.error || "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const ajouterResultat = () => navigation.navigate('AdminAddResultat');

  const supprimerResultat = (r) => {
    Alert.alert('Supprimer ce résultat ?', r.label, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await client.delete(`/parametres/resultats/${r.id}`); load(); } },
    ]);
  };

  const togglePositif = async (r) => {
    await client.patch(`/parametres/resultats/${r.id}`, { estPositif: !r.estPositif });
    load();
  };

  const supprimerChamp = (c) => {
    Alert.alert('Supprimer ce champ ?', c.label, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await client.delete(`/parametres/champs/${c.id}`); load(); } },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <FormError message={banner} variant="banner" />

      {/* Vocabulaire */}
      <Text style={styles.sectionTitle}>Vocabulaire métier</Text>
      <Text style={styles.sectionSub}>Le mot utilisé pour désigner une visite dans toute l'app (ex : "étude", "intervention", "diagnostic"...)</Text>
      <TextInput style={styles.input} value={labelVisite} onChangeText={setLabelVisite} placeholder="étude" />

      {/* Rappels SMS */}
      <Text style={styles.sectionTitle}>Rappel SMS au client</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Activer les rappels automatiques</Text>
        <Switch value={rappelSmsActif} onValueChange={setRappelSmsActif} trackColor={{ true: '#FF6B4A' }} />
      </View>
      {rappelSmsActif && (
        <View style={styles.delaisRow}>
          {DELAIS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.delaiChip, rappelDelaisH.includes(d.value) && styles.delaiChipActive]}
              onPress={() => toggleDelai(d.value)}
            >
              <Text style={[styles.delaiChipText, rappelDelaisH.includes(d.value) && styles.delaiChipTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.hint}>Un SMS est envoyé automatiquement au numéro du client à chaque délai coché. Tu peux en choisir plusieurs.</Text>

      <TouchableOpacity style={styles.saveBtn} onPress={enregistrerGeneral} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Enregistrement...' : 'Enregistrer ces paramètres'}</Text>
      </TouchableOpacity>

      {/* Résultats configurables */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Résultats possibles d'une visite</Text>
        <TouchableOpacity onPress={ajouterResultat}><Text style={styles.addLink}>+ Ajouter</Text></TouchableOpacity>
      </View>
      {resultats.map((r) => (
        <View key={r.id} style={styles.rowCard}>
          <Text style={styles.rowLabel}>{r.label}</Text>
          <View style={styles.rowActions}>
            <TouchableOpacity onPress={() => togglePositif(r)}>
              <Text style={[styles.positifTag, r.estPositif ? styles.positifOn : styles.positifOff]}>
                {r.estPositif ? 'Compte en positif' : 'Compte en négatif'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => supprimerResultat(r)}><Text style={styles.deleteText}>Suppr.</Text></TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Champs personnalisés */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Champs personnalisés de la visite</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminAddChamp')}><Text style={styles.addLink}>+ Ajouter</Text></TouchableOpacity>
      </View>
      <Text style={styles.sectionSub}>S'affichent automatiquement sur le formulaire de visite de tes techniciens, en plus des photos et documents.</Text>
      {champs.map((c) => (
        <View key={c.id} style={styles.rowCard}>
          <View>
            <Text style={styles.rowLabel}>{c.label}{c.obligatoire ? ' *' : ''}</Text>
            <Text style={styles.rowType}>{TYPES_CHAMP.find((t) => t.value === c.type)?.label}</Text>
          </View>
          <TouchableOpacity onPress={() => supprimerChamp(c)}><Text style={styles.deleteText}>Suppr.</Text></TouchableOpacity>
        </View>
      ))}
      {champs.length === 0 && <Text style={styles.empty}>Aucun champ personnalisé pour le moment</Text>}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Se déconnecter ?', '', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se déconnecter', style: 'destructive', onPress: logout },
        ])}
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginTop: 20, marginBottom: 6 },
  sectionSub: { fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 17 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 },
  addLink: { color: '#FF6B4A', fontWeight: '700', fontSize: 12.5 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 13, fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  switchLabel: { fontSize: 13.5, fontWeight: '600', color: '#1a1a2e' },
  delaisRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  delaiChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0' },
  delaiChipActive: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
  delaiChipText: { fontSize: 12.5, fontWeight: '700', color: '#555' },
  delaiChipTextActive: { color: '#fff' },
  hint: { fontSize: 11, color: '#999', marginTop: 8, lineHeight: 16 },
  saveBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8 },
  rowLabel: { fontSize: 13.5, fontWeight: '700', color: '#1a1a2e' },
  rowType: { fontSize: 11, color: '#999', marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  positifTag: { fontSize: 10.5, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  positifOn: { backgroundColor: '#DFF5EA', color: '#1F9D6B' },
  positifOff: { backgroundColor: '#f0f0f0', color: '#888' },
  deleteText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  empty: { color: '#999', fontStyle: 'italic', fontSize: 12.5 },
  logoutBtn: { marginTop: 30, marginBottom: 40, alignItems: 'center', padding: 12 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
});