import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, ScrollView } from 'react-native';
import client from '../api/client';

export default function RdvDetailScreen({ route, navigation }) {
  const { rdvId } = route.params;
  const [rdv, setRdv] = useState(null);
  const [labelVisite, setLabelVisite] = useState('visite');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [rdvRes, configRes] = await Promise.all([
      client.get(`/rdv/${rdvId}`),
      client.get('/config'),
    ]);
    setRdv(rdvRes.data);
    setLabelVisite(configRes.data.labelVisite);
    setLoading(false);
  };

  useEffect(() => { load(); }, [rdvId]);

  const demarrerVisite = async () => {
    const { data } = await client.patch(`/rdv/${rdvId}/start`);
    setRdv(data);
    navigation.navigate('Visite', { rdvId });
  };

  const ouvrirGPS = () => {
    if (!rdv?.adresse) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rdv.adresse)}`);
  };

  if (loading || !rdv) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B4A" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heure}>
        {new Date(rdv.dateHeure).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>{rdv.client.prenom} {rdv.client.nom}</Text>
        {rdv.client.telephone ? <Text style={styles.value}>{rdv.client.telephone}</Text> : null}
        <TouchableOpacity onPress={() => navigation.navigate('ClientDetail', { clientId: rdv.client.id })}>
          <Text style={styles.clientLink}>Voir la fiche client complète →</Text>
        </TouchableOpacity>
      </View>

      {rdv.adresse ? (
        <TouchableOpacity style={styles.card} onPress={ouvrirGPS}>
          <Text style={styles.label}>Adresse</Text>
          <Text style={styles.linkValue}>📍 {rdv.adresse}</Text>
          <Text style={styles.gpsBtn}>Lancer le GPS →</Text>
        </TouchableOpacity>
      ) : null}

      {rdv.notes ? (
        <View style={styles.card}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{rdv.notes}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Statut</Text>
        <Text style={styles.value}>{rdv.statut.replace('_', ' ')}</Text>
      </View>

      {rdv.statut === 'PLANIFIE' && (
        <TouchableOpacity style={styles.mainButton} onPress={demarrerVisite}>
          <Text style={styles.mainButtonText}>Commencer {labelVisite === 'étude' ? "l'" : 'la '}{labelVisite}</Text>
        </TouchableOpacity>
      )}

      {rdv.statut === 'EN_COURS' && (
        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('Visite', { rdvId })}>
          <Text style={styles.mainButtonText}>Reprendre {labelVisite === 'étude' ? "l'" : 'la '}{labelVisite}</Text>
        </TouchableOpacity>
      )}

      {rdv.statut === 'TERMINE' && (
        <>
          <View style={[styles.doneBadge, !rdv.resultat?.estPositif && styles.doneBadgeNeg]}>
            <Text style={[styles.doneText, !rdv.resultat?.estPositif && styles.doneTextNeg]}>
              {labelVisite.charAt(0).toUpperCase() + labelVisite.slice(1)} finalisée — {rdv.resultat?.label}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('Visite', { rdvId })}
          >
            <Text style={styles.editButtonText}>Modifier le dossier / ajouter un document</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heure: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16, textTransform: 'capitalize' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  label: { fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#1a1a2e' },
  clientLink: { color: '#FF6B4A', fontWeight: '600', fontSize: 12.5, marginTop: 8 },
  linkValue: { fontSize: 15, color: '#1a1a2e' },
  gpsBtn: { color: '#FF6B4A', marginTop: 6, fontWeight: '600' },
  mainButton: { backgroundColor: '#FF6B4A', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12, marginBottom: 40 },
  mainButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  doneBadge: { backgroundColor: '#dcfce7', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  doneBadgeNeg: { backgroundColor: '#f3f4f6' },
  doneText: { color: '#16a34a', fontWeight: '700' },
  doneTextNeg: { color: '#555' },
  editButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FF6B4A', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  editButtonText: { color: '#FF6B4A', fontWeight: '700' },
});
