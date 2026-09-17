import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ signes: 0, nonSignes: 0, total: 0, pourcentageSigne: 0 });
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [labelVisite, setLabelVisite] = useState('visite');

  const loadData = async () => {
    try {
      const [statsRes, notifRes, configRes] = await Promise.all([
        client.get('/stats'),
        client.get('/notifications'),
        client.get('/config'),
      ]);
      setStats(statsRes.data);
      setNotifications(notifRes.data.filter((n) => !n.lu));
      setLabelVisite(configRes.data.labelVisite);
    } catch (err) {
      console.log('Erreur chargement accueil', err);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const heureDuJour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.greeting}>{heureDuJour()}, {user?.prenom} 👋</Text>
      <Text style={styles.subGreeting}>Voici ton activité récente</Text>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Performance</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>{stats.signes}</Text>
            <Text style={styles.statLabel}>{labelVisite.charAt(0).toUpperCase() + labelVisite.slice(1)}s réussies</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#dc2626' }]}>{stats.nonSignes}</Text>
            <Text style={styles.statLabel}>À retravailler</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#2563eb' }]}>{stats.pourcentageSigne}%</Text>
            <Text style={styles.statLabel}>Taux de réussite</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Notifications non lues ({notifications.length})</Text>
      {notifications.length === 0 && <Text style={styles.empty}>Aucune notification pour le moment</Text>}
      {notifications.map((n) => (
        <TouchableOpacity key={n.id} style={styles.notifCard}>
          <Text style={styles.notifTitle}>{n.titre}</Text>
          <Text style={styles.notifMessage}>{n.message}</Text>
        </TouchableOpacity>
      ))}

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
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  subGreeting: { fontSize: 14, color: '#777', marginBottom: 20 },
  statsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 14, color: '#1a1a2e' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#777', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 10 },
  empty: { color: '#999', fontStyle: 'italic' },
  notifCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  notifTitle: { fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  notifMessage: { color: '#666', fontSize: 13 },
  logoutBtn: { marginTop: 30, marginBottom: 20, alignItems: 'center', padding: 12 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
});