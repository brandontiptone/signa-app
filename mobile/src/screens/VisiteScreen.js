import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, TextInput, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import client from '../api/client';
import FormError from '../components/FormError';

export default function VisiteScreen({ route, navigation }) {
  const { rdvId } = route.params;
  const [documents, setDocuments] = useState([]);
  const [rdvInfo, setRdvInfo] = useState(null);
  const [config, setConfig] = useState({ labelVisite: 'étude', resultats: [], champs: [] });
  const [reponses, setReponses] = useState({}); // { champId: valeur }
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(null); // id du résultat en cours d'envoi
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [banner, setBanner] = useState('');

  const load = async () => {
    const [rdvRes, configRes] = await Promise.all([
      client.get(`/rdv/${rdvId}`),
      client.get('/config'),
    ]);
    setDocuments(rdvRes.data.documents || []);
    setRdvInfo(rdvRes.data);
    setNote(rdvRes.data.notes || '');
    setConfig(configRes.data);

    const initReponses = {};
    (rdvRes.data.reponses || []).forEach((r) => { initReponses[r.champId] = r.valeur; });
    setReponses(initReponses);
  };

  useEffect(() => { load(); }, []);

  const uploadFile = async (uri, name, type) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri, name, type: 'application/octet-stream' });
      formData.append('type', type);
      await client.post(`/documents/${rdvId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data } = await client.get(`/rdv/${rdvId}`);
      setDocuments(data.documents || []);
    } catch (err) {
      setBanner("L'envoi du document a échoué. Réessaie.");
    } finally {
      setUploading(false);
    }
  };

  const prendrePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return setBanner("L'accès à la caméra est refusé — active-le dans les réglages du téléphone.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, `photo-${Date.now()}.jpg`, 'PHOTO');
    }
  };

  const choisirDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name, 'DOCUMENT');
    }
  };

  const enregistrerNote = async () => {
    setSavingNote(true);
    try {
      await client.patch(`/rdv/${rdvId}/notes`, { notes: note });
    } catch (err) {
      setBanner("Impossible d'enregistrer la note.");
    } finally {
      setSavingNote(false);
    }
  };

  const majReponse = (champId, valeur) => setReponses((r) => ({ ...r, [champId]: valeur }));

  const enregistrerReponses = async () => {
    const payload = Object.entries(reponses).map(([champId, valeur]) => ({ champId, valeur }));
    await client.post(`/rdv/${rdvId}/reponses`, { reponses: payload });
  };

  const finaliser = async (resultat) => {
    const dejaFinalise = rdvInfo?.statut === 'TERMINE';
    Alert.alert(
      dejaFinalise ? 'Mettre à jour le dossier' : `Finaliser ${config.labelVisite === 'étude' ? "l'" : 'la '}${config.labelVisite}`,
      `Confirmer le résultat "${resultat.label}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setBanner('');
            setFinalizing(resultat.id);
            try {
              await enregistrerReponses();
              const { data } = await client.patch(`/rdv/${rdvId}/finalize`, { resultatId: resultat.id, notes: note });
              setRdvInfo(data);
              Alert.alert(
                dejaFinalise ? 'Dossier mis à jour' : 'Visite finalisée',
                `Le dossier a bien été enregistré (${resultat.label}), et l'administrateur a été notifié.`
              );
              navigation.navigate('PlanningTabs');
            } catch (err) {
              const data = err?.response?.data;
              if (data?.error === 'CHAMPS_OBLIGATOIRES_MANQUANTS') {
                setBanner(data.message);
              } else {
                setBanner("Impossible d'enregistrer le dossier. Réessaie.");
              }
            } finally {
              setFinalizing(null);
            }
          },
        },
      ]
    );
  };

  const renderChamp = (champ) => {
    const valeur = reponses[champ.id] ?? '';
    if (champ.type === 'CHOIX') {
      return (
        <View style={styles.choixRow}>
          {champ.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.choixChip, valeur === opt && styles.choixChipActive]}
              onPress={() => majReponse(champ.id, opt)}
            >
              <Text style={[styles.choixChipText, valeur === opt && styles.choixChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (champ.type === 'CASE_A_COCHER') {
      return (
        <View style={styles.switchRow}>
          <Switch value={valeur === 'true'} onValueChange={(v) => majReponse(champ.id, v ? 'true' : 'false')} trackColor={{ true: '#FF6B4A' }} />
        </View>
      );
    }
    return (
      <TextInput
        style={[styles.champInput, champ.type === 'ZONE_TEXTE' && styles.champInputMulti]}
        value={valeur}
        onChangeText={(v) => majReponse(champ.id, v)}
        keyboardType={champ.type === 'NOMBRE' ? 'numeric' : 'default'}
        multiline={champ.type === 'ZONE_TEXTE'}
      />
    );
  };

  if (!rdvInfo) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B4A" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Documents de la visite</Text>
      <Text style={styles.subtitle}>Prends des photos ou ajoute des documents pour constituer le dossier</Text>

      <FormError message={banner} variant="banner" />

      {rdvInfo?.statut === 'TERMINE' && (
        <View style={styles.reopenBanner}>
          <Text style={styles.reopenText}>
            Dossier déjà finalisé ({rdvInfo.resultat?.label}) — tu peux toujours ajouter des documents ou corriger le résultat ci-dessous.
          </Text>
        </View>
      )}

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={prendrePhoto} disabled={uploading}>
          <Text style={styles.actionText}>📷 Prendre une photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonAlt} onPress={choisirDocument} disabled={uploading}>
          <Text style={styles.actionTextAlt}>📎 Ajouter un document</Text>
        </TouchableOpacity>
      </View>

      {uploading && <ActivityIndicator style={{ marginVertical: 10 }} color="#FF6B4A" />}

      <View style={styles.docsGrid}>
        {documents.map((doc) => (
          <View key={doc.id} style={styles.docItem}>
            {doc.type === 'PHOTO' ? (
              <Image source={{ uri: doc.url }} style={styles.docImage} />
            ) : (
              <View style={styles.docFile}><Text style={{ fontSize: 24 }}>📄</Text></View>
            )}
            <Text numberOfLines={1} style={styles.docName}>{doc.nom}</Text>
          </View>
        ))}
      </View>
      {documents.length === 0 && <Text style={styles.empty}>Aucun document ajouté pour l'instant</Text>}

      {/* Champs personnalisés définis par l'entreprise */}
      {config.champs.length > 0 && (
        <View style={styles.champsBlock}>
          <Text style={styles.champsTitle}>Détails de la visite</Text>
          {config.champs.map((champ) => (
            <View key={champ.id} style={styles.champBlock}>
              <Text style={styles.champLabel}>{champ.label}{champ.obligatoire ? ' *' : ''}</Text>
              {renderChamp(champ)}
            </View>
          ))}
        </View>
      )}

      <View style={styles.noteBlock}>
        <Text style={styles.noteLabel}>Note / commentaire (optionnel)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Ex : client hésitant sur le prix, à rappeler avec une offre..."
          placeholderTextColor="#aaa"
          multiline
          value={note}
          onChangeText={setNote}
        />
        <View style={styles.noteSaveRow}>
          <TouchableOpacity style={styles.noteSaveBtn} onPress={enregistrerNote} disabled={savingNote}>
            <Text style={styles.noteSaveText}>{savingNote ? 'Enregistrement...' : 'Enregistrer la note'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.finalizeBlock}>
        <Text style={styles.finalizeTitle}>Résultat de {config.labelVisite === 'étude' ? "l'" : 'la '}{config.labelVisite}</Text>
        {config.resultats.map((resultat) => (
          <TouchableOpacity
            key={resultat.id}
            style={[styles.resultatBtn, resultat.estPositif ? styles.resultatPositif : styles.resultatNegatif]}
            onPress={() => finaliser(resultat)}
            disabled={finalizing !== null}
          >
            <Text style={resultat.estPositif ? styles.resultatPositifText : styles.resultatNegatifText}>
              {finalizing === resultat.id ? '...' : (rdvInfo?.statut === 'TERMINE' ? 'Mettre à jour — ' : '') + resultat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#777', marginBottom: 16 },
  reopenBanner: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  reopenText: { fontSize: 12.5, color: '#1e3a8a', lineHeight: 18 },
  buttonsRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, backgroundColor: '#FF6B4A', borderRadius: 12, padding: 14, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  actionButtonAlt: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF6B4A', borderRadius: 12, padding: 14, alignItems: 'center' },
  actionTextAlt: { color: '#FF6B4A', fontWeight: '600', fontSize: 13 },
  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  docItem: { width: '30%' },
  docImage: { width: '100%', height: 90, borderRadius: 10, backgroundColor: '#eee' },
  docFile: { width: '100%', height: 90, borderRadius: 10, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 11, color: '#666', marginTop: 4 },
  empty: { color: '#999', fontStyle: 'italic', marginTop: 16, textAlign: 'center' },
  champsBlock: { marginTop: 24 },
  champsTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  champBlock: { marginBottom: 14 },
  champLabel: { fontSize: 12.5, fontWeight: '600', color: '#444', marginBottom: 6 },
  champInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 14 },
  champInputMulti: { minHeight: 70, textAlignVertical: 'top' },
  choixRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choixChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' },
  choixChipActive: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
  choixChipText: { fontSize: 12.5, fontWeight: '600', color: '#555' },
  choixChipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row' },
  noteBlock: { marginTop: 22 },
  noteLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  noteInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },
  noteSaveRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  noteSaveBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#FFE8E1' },
  noteSaveText: { color: '#E8522F', fontWeight: '700', fontSize: 12.5 },
  finalizeBlock: { marginTop: 30, marginBottom: 40 },
  finalizeTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 10, textTransform: 'capitalize' },
  resultatBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  resultatPositif: { backgroundColor: '#16a34a' },
  resultatNegatif: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dc2626' },
  resultatPositifText: { color: '#fff', fontWeight: '700' },
  resultatNegatifText: { color: '#dc2626', fontWeight: '700' },
});
