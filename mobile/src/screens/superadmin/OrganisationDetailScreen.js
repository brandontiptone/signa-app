import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import client, { API_URL } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FormError from '../../components/FormError';

export default function OrganisationDetailScreen({ route }) {
  const { organisationId } = route.params;
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // id de la facture en cours de traitement (PDF/email)
  const [banner, setBanner] = useState('');

  const load = async () => {
    try {
      const { data } = await client.get(`/superadmin/organisations/${organisationId}`);
      setOrg(data);
    } catch (err) {
      console.log('Erreur fiche entreprise', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [organisationId]));

  const togglePaiement = async (facture) => {
    setBanner('');
    try {
      const nouveauStatut = facture.statut === 'PAYEE' ? 'IMPAYEE' : 'PAYEE';
      await client.patch(`/superadmin/factures/${facture.id}`, { statut: nouveauStatut });
      load();
    } catch (err) {
      setBanner('Impossible de mettre à jour le statut de cette facture. Réessaie.');
    }
  };

  const genererFacture = () => {
    Alert.alert('Générer une facture', `Nouvelle facture pour ${org.nom} (mois en cours), au tarif du pack actuel (${org.plan.prixMensuel.toFixed(2)} €) ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Générer',
        onPress: async () => {
          setBanner('');
          try {
            await client.post(`/superadmin/organisations/${organisationId}/factures`, {});
            load();
          } catch (err) {
            setBanner('La génération de la facture a échoué. Réessaie.');
          }
        },
      },
    ]);
  };

  const supprimerFacture = (facture) => {
    Alert.alert(
      'Supprimer cette facture ?',
      `${facture.periode} — ${facture.montant.toFixed(2)} €. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setBanner('');
            try {
              await client.delete(`/superadmin/factures/${facture.id}`);
              load();
            } catch (err) {
              setBanner('Impossible de supprimer cette facture. Réessaie.');
            }
          },
        },
      ]
    );
  };

  // Télécharge le PDF puis ouvre le menu de partage natif (Mail, WhatsApp, Fichiers...)
  const voirPdf = async (facture) => {
    setBanner('');
    setBusyId(facture.id + '-pdf');
    try {
      const token = await AsyncStorage.getItem('token');
      const fileUri = FileSystem.documentDirectory + `facture-${facture.numero}.pdf`;
      const { uri } = await FileSystem.downloadAsync(
        `${API_URL}/superadmin/factures/${facture.id}/pdf`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Facture ${facture.numero}` });
      }
    } catch (err) {
      setBanner("Impossible d'ouvrir le PDF de cette facture. Vérifie ta connexion et réessaie.");
    } finally {
      setBusyId(null);
    }
  };

  // Envoi direct par email depuis le serveur (sans passer par l'app mail du téléphone)
  const envoyerParEmail = (facture) => {
    setBanner('');
    const emailAdmin = org.admins[0]?.email;
    if (!emailAdmin) {
      setBanner("Aucun email admin n'est enregistré pour cette entreprise — impossible d'envoyer la facture.");
      return;
    }
    Alert.alert('Envoyer la facture', `Envoyer à ${emailAdmin} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Envoyer',
        onPress: async () => {
          setBusyId(facture.id + '-mail');
          try {
            await client.post(`/superadmin/factures/${facture.id}/envoyer`, {});
            load();
          } catch (err) {
            const data = err?.response?.data;
            if (data?.error === 'SMTP_NON_CONFIGURE') {
              setBanner(data.message);
            } else {
              setBanner("L'envoi de la facture a échoué. Réessaie.");
            }
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  if (loading || !org) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B4A" /></View>;

  const impayees = org.factures.filter((f) => f.statut === 'IMPAYEE');

  return (
    <ScrollView style={styles.container}>
      <FormError message={banner} variant="banner" />

      <View style={styles.header}>
        <Text style={styles.orgName}>{org.nom}</Text>
        <Text style={[styles.statusBadge, org.statut === 'ACTIF' ? styles.badgeActif : styles.badgeSuspendu]}>
          {org.statut === 'ACTIF' ? 'Actif' : 'Suspendu'}
        </Text>
        <Text style={styles.meta}>Pack {org.plan.nom} — {org.plan.prixMensuel.toFixed(2)} €/mois</Text>
        <Text style={styles.meta}>
          {org.techniciens.length} technicien(s) / {org.plan.maxTechniciens === null ? 'illimité' : org.plan.maxTechniciens}
        </Text>
      </View>

      {impayees.length > 0 && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>⚠️ {impayees.length} facture(s) impayée(s)</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Équipe</Text>
      {org.admins.map((a) => (
        <View key={a.id} style={styles.personRow}>
          <Text style={styles.personName}>{a.prenom} {a.nom}</Text>
          <Text style={styles.personTag}>Admin</Text>
        </View>
      ))}
      {org.techniciens.map((t) => (
        <View key={t.id} style={styles.personRow}>
          <Text style={styles.personName}>{t.prenom} {t.nom}</Text>
          <Text style={styles.personTagTech}>Technicien</Text>
        </View>
      ))}

      <View style={styles.factureHeaderRow}>
        <Text style={styles.sectionTitle}>Facturation</Text>
        <TouchableOpacity onPress={genererFacture}>
          <Text style={styles.genererLink}>+ Générer une facture</Text>
        </TouchableOpacity>
      </View>

      {org.factures.map((f) => (
        <View key={f.id} style={styles.factureCard}>
          <View style={styles.factureTop}>
            <View>
              <Text style={styles.facturePeriode}>{f.periode}</Text>
              <Text style={styles.factureNumero}>{f.numero}</Text>
              <Text style={styles.factureMontant}>{f.montant.toFixed(2)} €</Text>
              {f.envoyeeLe && <Text style={styles.factureEnvoyee}>Envoyée le {new Date(f.envoyeeLe).toLocaleDateString('fr-FR')}</Text>}
            </View>
            <TouchableOpacity
              style={[styles.factureBadge, f.statut === 'PAYEE' ? styles.badgePayee : styles.badgeImpayee]}
              onPress={() => togglePaiement(f)}
            >
              <Text style={f.statut === 'PAYEE' ? styles.textPayee : styles.textImpayee}>
                {f.statut === 'PAYEE' ? 'Payée ✓' : 'Impayée'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.factureActions}>
            <TouchableOpacity style={styles.factureActionBtn} onPress={() => voirPdf(f)} disabled={busyId === f.id + '-pdf'}>
              <Text style={styles.factureActionText}>{busyId === f.id + '-pdf' ? '...' : '📄 Voir le PDF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.factureActionBtn} onPress={() => envoyerParEmail(f)} disabled={busyId === f.id + '-mail'}>
              <Text style={styles.factureActionText}>{busyId === f.id + '-mail' ? '...' : '✉️ Envoyer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.factureActionBtn} onPress={() => supprimerFacture(f)}>
              <Text style={styles.factureDeleteText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {org.factures.length === 0 && <Text style={styles.empty}>Aucune facture pour le moment</Text>}
      <Text style={styles.hint}>Touche le badge pour basculer payée / impayée</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  orgName: { fontSize: 19, fontWeight: '800', color: '#1a1a2e' },
  statusBadge: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 6, textTransform: 'uppercase', overflow: 'hidden' },
  badgeActif: { backgroundColor: '#DFF5EA', color: '#1F9D6B' },
  badgeSuspendu: { backgroundColor: '#FDECEC', color: '#C0392B' },
  meta: { fontSize: 12.5, color: '#666', marginTop: 6 },
  warnBox: { backgroundColor: '#FFF3DC', borderRadius: 12, padding: 12, marginBottom: 16 },
  warnText: { color: '#966400', fontWeight: '700', fontSize: 12.5 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  personRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 11, marginBottom: 6 },
  personName: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  personTag: { fontSize: 10.5, fontWeight: '700', color: '#FF6B4A' },
  personTagTech: { fontSize: 10.5, fontWeight: '700', color: '#888' },
  factureHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  genererLink: { color: '#FF6B4A', fontWeight: '700', fontSize: 12 },
  factureCard: { backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8 },
  factureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  facturePeriode: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', textTransform: 'capitalize' },
  factureNumero: { fontSize: 10.5, color: '#aaa', marginTop: 1 },
  factureMontant: { fontSize: 12, color: '#888', marginTop: 3 },
  factureEnvoyee: { fontSize: 10, color: '#1F9D6B', marginTop: 2 },
  factureBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  badgePayee: { backgroundColor: '#DFF5EA' },
  badgeImpayee: { backgroundColor: '#FDECEC' },
  textPayee: { color: '#1F9D6B', fontWeight: '700', fontSize: 11.5 },
  textImpayee: { color: '#C0392B', fontWeight: '700', fontSize: 11.5 },
  factureActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  factureActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 7 },
  factureActionText: { fontSize: 11.5, fontWeight: '700', color: '#2563eb' },
  factureDeleteText: { fontSize: 11.5, fontWeight: '700', color: '#dc2626' },
  empty: { color: '#999', fontStyle: 'italic' },
  hint: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 8, marginBottom: 30 },
});
