import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await client.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.log('Erreur stats admin', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalSignes = stats.reduce((acc, s) => acc + s.signes, 0);
  const totalNonSignes = stats.reduce((acc, s) => acc + s.nonSignes, 0);
  const totalGlobal = totalSignes + totalNonSignes;
  const pourcentageGlobal = totalGlobal > 0 ? Math.round((totalSignes / totalGlobal) * 100) : 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.greeting}>Bonjour {user?.prenom} 👋</Text>
      <Text style={styles.subGreeting}>Vue d'ensemble de l'équipe</Text>

      <View style={styles.globalCard}>
        <Text style={styles.globalTitle}>Performance globale</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>{totalSignes}</Text>
            <Text style={styles.statLabel}>Signés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#dc2626' }]}>{totalNonSignes}</Text>
            <Text style={styles.statLabel}>Non signés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#2563eb' }]}>{pourcentageGlobal}%</Text>
            <Text style={styles.statLabel}>Taux global</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Par commercial</Text>
      {stats.map((s) => (
        <View key={s.commercialId} style={styles.commercialCard}>
          <Text style={styles.commercialName}>{s.prenom} {s.nom}</Text>
          <View style={styles.commercialStats}>
            <Text style={styles.commercialStat}>✅ {s.signes} signés</Text>
            <Text style={styles.commercialStat}>❌ {s.nonSignes} non signés</Text>
            <Text style={styles.commercialPct}>{s.pourcentageSigne}%</Text>
          </View>
        </View>
      ))}
      {stats.length === 0 && <Text style={styles.empty}>Aucune donnée pour le moment</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  subGreeting: { fontSize: 14, color: '#777', marginBottom: 20 },
  globalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24, elevation: 2 },
  globalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 14, color: '#1a1a2e' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#777', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 10 },
  commercialCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  commercialName: { fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  commercialStats: { flexDirection: 'row', justifyContent: 'space-between' },
  commercialStat: { fontSize: 13, color: '#666' },
  commercialPct: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  empty: { color: '#999', fontStyle: 'italic' },
});
