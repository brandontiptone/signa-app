import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

export default function AdminPlanningScreen({ navigation }) {
  const [commerciaux, setCommerciaux] = useState([]);
  const [filtreId, setFiltreId] = useState(null); // null = tous
  const [sections, setSections] = useState([]);

  const load = async () => {
    try {
      const [commRes, rdvRes] = await Promise.all([
        client.get('/admin/commerciaux'),
        client.get('/admin/rdv', { params: filtreId ? { commercialId: filtreId } : {} }),
      ]);
      setCommerciaux(commRes.data.commerciaux || commRes.data);

      const groupes = {};
      rdvRes.data.forEach((rdv) => {
        const jour = new Date(rdv.dateHeure).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long',
        });
        if (!groupes[jour]) groupes[jour] = [];
        groupes[jour].push(rdv);
      });
      setSections(Object.keys(groupes).map((jour) => ({ title: jour, data: groupes[jour] })));
    } catch (err) {
      console.log('Erreur planning admin', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [filtreId]));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newRdvButton} onPress={() => navigation.navigate('AdminCreateRdv')}>
        <Text style={styles.newRdvButtonText}>+ Attribuer un nouveau RDV</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{ paddingHorizontal: 12 }}>
        <TouchableOpacity
          style={[styles.chip, !filtreId && styles.chipActive]}
          onPress={() => setFiltreId(null)}
        >
          <Text style={[styles.chipText, !filtreId && styles.chipTextActive]}>Tous</Text>
        </TouchableOpacity>
        {commerciaux.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, filtreId === c.id && styles.chipActive]}
            onPress={() => setFiltreId(c.id)}
          >
            <Text style={[styles.chipText, filtreId === c.id && styles.chipTextActive]}>{c.prenom}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Text style={styles.commercialTag}>{item.commercial.prenom} {item.commercial.nom}</Text>
            </View>
            <Text style={styles.client}>{item.client.prenom} {item.client.nom}</Text>
            <Text style={styles.statut}>{item.statut.replace('_', ' ')}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun rendez-vous</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  newRdvButton: { backgroundColor: '#2563eb', margin: 12, borderRadius: 12, padding: 14, alignItems: 'center' },
  newRdvButtonText: { color: '#fff', fontWeight: '700' },
  filters: { paddingVertical: 10, backgroundColor: '#fff' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#555', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#fff', backgroundColor: '#1a1a2e', padding: 10, textTransform: 'capitalize' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heure: { fontWeight: '700', fontSize: 15, color: '#1a1a2e' },
  commercialTag: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  client: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginTop: 4 },
  statut: { fontSize: 12, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
