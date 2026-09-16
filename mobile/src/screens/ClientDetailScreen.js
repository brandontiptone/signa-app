import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import client from '../api/client';

export default function ClientDetailScreen({ route, navigation }) {
  const { clientId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/clients/${clientId}`);
      setData(data);
    } catch (err) {
      console.log('Erreur fiche client', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  if (loading || !data) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{data.prenom} {data.nom}</Text>
        {data.telephone ? <Text style={styles.meta}>📞 {data.telephone}</Text> : null}
        {data.adresse ? (
          <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.adresse)}`)}>
            <Text style={[styles.meta, styles.link]}>📍 {data.adresse}</Text>
          </TouchableOpacity>
        ) : null}
        {data.commercial ? <Text style={styles.meta}>Suivi par {data.commercial.prenom} {data.commercial.nom}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Historique des dossiers ({data.rdvs.length})</Text>

      {data.rdvs.length === 0 && <Text style={styles.empty}>Aucun rendez-vous pour ce client pour le moment</Text>}

      {data.rdvs.map((rdv) => (
        <TouchableOpacity
          key={rdv.id}
          style={styles.rdvCard}
          onPress={() => navigation.navigate('RdvDetail', { rdvId: rdv.id })}
        >
          <View style={styles.rdvTop}>
            <Text style={styles.rdvDate}>
              {new Date(rdv.dateHeure).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={[styles.badge, badgeStyle(rdv)]}>
              {rdv.statut === 'TERMINE' ? rdv.resultat?.label : rdv.statut.replace('_', ' ')}
            </Text>
          </View>
          {rdv.notes ? <Text style={styles.rdvNote} numberOfLines={2}>💬 {rdv.notes}</Text> : null}
          <Text style={styles.rdvDocs}>{rdv.documents.length} document(s) joint(s)</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function badgeStyle(rdv) {
  if (rdv.statut === 'TERMINE') {
    return rdv.resultat?.estPositif
      ? { backgroundColor: '#dcfce7', color: '#16a34a' }
      : { backgroundColor: '#f3f4f6', color: '#666' };
  }
  return { backgroundColor: '#dbeafe', color: '#2563eb' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20 },
  name: { fontSize: 19, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  meta: { fontSize: 13, color: '#666', marginBottom: 3 },
  link: { color: '#2563eb' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  empty: { color: '#999', fontStyle: 'italic' },
  rdvCard: { backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 10 },
  rdvTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rdvDate: { fontWeight: '700', fontSize: 13.5, color: '#1a1a2e' },
  badge: { fontSize: 10.5, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  rdvNote: { fontSize: 12.5, color: '#555', marginTop: 4, fontStyle: 'italic' },
  rdvDocs: { fontSize: 11.5, color: '#999', marginTop: 4 },
});
