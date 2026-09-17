import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function OrganisationsScreen({ navigation }) {
  const { logout } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await client.get('/superadmin/organisations');
      setOrgs(data);
    } catch (err) {
      console.log('Erreur organisations', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const revenuTotal = orgs
    .filter((o) => o.statut === 'ACTIF')
    .reduce((acc, o) => acc + o.plan.prixMensuel, 0);

  const toggleStatut = (org) => {
    const nouveauStatut = org.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    const action = nouveauStatut === 'SUSPENDU' ? 'suspendre' : 'réactiver';
    Alert.alert(
      `Confirmer : ${action} ${org.nom} ?`,
      nouveauStatut === 'SUSPENDU'
        ? "L'admin et tous les techniciens de cette entreprise perdront immédiatement l'accès."
        : "L'accès sera immédiatement rétabli pour toute l'entreprise.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: nouveauStatut === 'SUSPENDU' ? 'destructive' : 'default',
          onPress: async () => {
            await client.patch(`/superadmin/organisations/${org.id}/statut`, { statut: nouveauStatut });
            load();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Entreprises clientes</Text>
      <Text style={styles.sub}>Pilotage des accès loués — Signa</Text>

      <TouchableOpacity onPress={() => Alert.alert('Se déconnecter ?', '', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ])} style={styles.logoutLink}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.revenueRow}>
        <View style={styles.revenueBox}>
          <Text style={styles.revenueNum}>{revenuTotal.toFixed(2)} €</Text>
          <Text style={styles.revenueLabel}>Revenu mensuel récurrent</Text>
        </View>
        <View style={styles.revenueBox}>
          <Text style={styles.revenueNum}>{orgs.filter((o) => o.statut === 'ACTIF').length}</Text>
          <Text style={styles.revenueLabel}>Entreprises actives</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateOrganisation')}>
        <Text style={styles.addBtnText}>+ Ajouter une entreprise cliente</Text>
      </TouchableOpacity>

      {orgs.map((org) => {
        const pct = org.techniciensMax ? Math.min((org.techniciensUtilises / org.techniciensMax) * 100, 100) : 30;
        return (
          <TouchableOpacity
            key={org.id}
            style={styles.card}
            onPress={() => navigation.navigate('OrganisationDetail', { organisationId: org.id })}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.orgName}>{org.nom}</Text>
                <Text style={styles.orgPrice}>{org.plan.prixMensuel.toFixed(2)} €/mois</Text>
              </View>
              <Text style={styles.planTag}>{org.plan.nom}</Text>
            </View>
            <Text style={[styles.statusBadge, org.statut === 'ACTIF' ? styles.badgeActif : styles.badgeSuspendu]}>
              {org.statut === 'ACTIF' ? 'Actif' : 'Suspendu'}
            </Text>
            <View style={styles.seatsBlock}>
              <View style={styles.seatsLabelRow}>
                <Text style={styles.seatsLabel}>Techniciens</Text>
                <Text style={styles.seatsLabel}>
                  {org.techniciensUtilises} / {org.techniciensMax === null ? '∞' : org.techniciensMax}
                </Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, org.statut === 'ACTIF' ? styles.suspendBtn : styles.activateBtn]}
              onPress={() => toggleStatut(org)}
            >
              <Text style={org.statut === 'ACTIF' ? styles.suspendText : styles.activateText}>
                {org.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.viewDetail}>Voir la fiche complète (équipe, factures) →</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  sub: { fontSize: 12.5, color: '#888', marginBottom: 18 },
  logoutLink: { alignSelf: 'flex-end', marginTop: -30, marginBottom: 16 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 12.5 },
  revenueRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  revenueBox: { flex: 1, backgroundColor: '#1B2340', borderRadius: 14, padding: 14 },
  revenueNum: { color: '#fff', fontSize: 19, fontWeight: '800' },
  revenueLabel: { color: '#A7ABC7', fontSize: 10.5, marginTop: 3 },
  addBtn: { backgroundColor: '#FF6B4A', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orgName: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  orgPrice: { fontSize: 11, color: '#888', marginTop: 2 },
  planTag: { fontSize: 10.5, fontWeight: '700', backgroundColor: '#FFE8E1', color: '#E8522F', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  statusBadge: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, textTransform: 'uppercase', overflow: 'hidden' },
  badgeActif: { backgroundColor: '#DFF5EA', color: '#1F9D6B' },
  badgeSuspendu: { backgroundColor: '#FDECEC', color: '#C0392B' },
  seatsBlock: { marginTop: 10 },
  seatsLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  seatsLabel: { fontSize: 11, color: '#555' },
  track: { height: 7, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#1F9D6B', borderRadius: 6 },
  actionBtn: { marginTop: 12, borderRadius: 10, padding: 10, alignItems: 'center' },
  suspendBtn: { backgroundColor: '#FDECEC' },
  activateBtn: { backgroundColor: '#DFF5EA' },
  suspendText: { color: '#C0392B', fontWeight: '700', fontSize: 12 },
  activateText: { color: '#1F9D6B', fontWeight: '700', fontSize: 12 },
  viewDetail: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 10 },
});