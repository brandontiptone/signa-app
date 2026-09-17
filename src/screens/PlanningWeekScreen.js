import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function getWeekRange(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

export default function PlanningWeekScreen({ navigation }) {
  const [weekStart, setWeekStart] = useState(new Date());
  const [rdvs, setRdvs] = useState([]);

  const load = async () => {
    const { monday, sunday } = getWeekRange(weekStart);
    try {
      const { data } = await client.get('/rdv', {
        params: { from: monday.toISOString(), to: sunday.toISOString() },
      });
      setRdvs(data);
    } catch (err) {
      console.log('Erreur planning', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [weekStart]));

  const { monday } = getWeekRange(weekStart);
  const jours = JOURS.map((nom, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { nom, date };
  });

  const rdvsDuJour = (date) =>
    rdvs.filter((r) => new Date(r.dateHeure).toDateString() === date.toDateString());

  const changeWeek = (delta) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={() => changeWeek(-1)}><Text style={styles.nav}>‹</Text></TouchableOpacity>
        <Text style={styles.weekLabel}>
          Semaine du {monday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </Text>
        <TouchableOpacity onPress={() => changeWeek(1)}><Text style={styles.nav}>›</Text></TouchableOpacity>
      </View>

      <ScrollView>
        {jours.map(({ nom, date }) => (
          <View key={nom} style={styles.dayBlock}>
            <Text style={styles.dayTitle}>{nom} {date.getDate()}</Text>
            {rdvsDuJour(date).length === 0 && <Text style={styles.noRdv}>Aucun RDV</Text>}
            {rdvsDuJour(date).map((rdv) => (
              <TouchableOpacity
                key={rdv.id}
                style={styles.rdvCard}
                onPress={() => navigation.navigate('RdvDetail', { rdvId: rdv.id })}
              >
                <Text style={styles.rdvHeure}>
                  {new Date(rdv.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rdvClient}>{rdv.client.prenom} {rdv.client.nom}</Text>
                  <Text style={styles.rdvStatut}>{rdv.statut.replace('_', ' ')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  nav: { fontSize: 26, color: '#2563eb', paddingHorizontal: 12 },
  weekLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  dayBlock: { paddingHorizontal: 16, paddingTop: 14 },
  dayTitle: { fontWeight: '700', fontSize: 15, color: '#1a1a2e', marginBottom: 6 },
  noRdv: { color: '#999', fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  rdvCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' },
  rdvHeure: { fontWeight: '700', color: '#2563eb', marginRight: 12, fontSize: 14 },
  rdvClient: { fontWeight: '600', color: '#1a1a2e' },
  rdvStatut: { fontSize: 12, color: '#888', marginTop: 2, textTransform: 'capitalize' },
});
