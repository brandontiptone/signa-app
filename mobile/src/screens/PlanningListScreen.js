import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function PlanningListScreen({ navigation }) {
  const [sections, setSections] = useState([]);

  const load = async () => {
    try {
      const { data } = await client.get('/rdv');
      const groupes = {};
      data.forEach((rdv) => {
        const jour = new Date(rdv.dateHeure).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long',
        });
        if (!groupes[jour]) groupes[jour] = [];
        groupes[jour].push(rdv);
      });
      const sec = Object.keys(groupes).map((jour) => ({ title: jour, data: groupes[jour] }));
      setSections(sec);
    } catch (err) {
      console.log('Erreur liste RDV', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const ouvrirGPS = (adresse) => {
    if (!adresse) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RdvDetail', { rdvId: item.id })}>
            <View style={styles.cardTop}>
              <Text style={styles.heure}>
                {new Date(item.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={[styles.badge, badgeStyle(item.statut)]}>{item.statut.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.client}>{item.client.prenom} {item.client.nom}</Text>
            {item.adresse ? (
              <TouchableOpacity onPress={() => ouvrirGPS(item.adresse)}>
                <Text style={styles.adresse}>📍 {item.adresse} — y aller</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun rendez-vous planifié</Text>}
      />
    </View>
  );
}

function badgeStyle(statut) {
  switch (statut) {
    case 'TERMINE': return { backgroundColor: '#dcfce7', color: '#16a34a' };
    case 'EN_COURS': return { backgroundColor: '#fef9c3', color: '#ca8a04' };
    case 'ANNULE': return { backgroundColor: '#fee2e2', color: '#dc2626' };
    default: return { backgroundColor: '#dbeafe', color: '#2563eb' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#fff', backgroundColor: '#1a1a2e', padding: 10, textTransform: 'capitalize' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heure: { fontWeight: '700', fontSize: 15, color: '#1a1a2e' },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', textTransform: 'capitalize' },
  client: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginTop: 4 },
  adresse: { color: '#2563eb', marginTop: 6, fontSize: 13 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
