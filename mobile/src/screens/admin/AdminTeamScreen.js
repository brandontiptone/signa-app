import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';

export default function AdminTeamScreen({ navigation }) {
  const [commerciaux, setCommerciaux] = useState([]);
  const [pack, setPack] = useState(null);

  const load = async () => {
    try {
      const { data } = await client.get('/admin/commerciaux');
      setCommerciaux(data.commerciaux);
      setPack(data.pack);
    } catch (err) {
      console.log('Erreur équipe', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const supprimer = (technicien) => {
    Alert.alert(
      'Retirer ce technicien ?',
      `${technicien.prenom} ${technicien.nom} perdra son accès à l'application.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            await client.delete(`/admin/commerciaux/${technicien.id}`);
            load();
          },
        },
      ]
    );
  };

  const limiteAtteinte = pack && pack.max !== null && pack.utilises >= pack.max;

  return (
    <View style={styles.container}>
      {pack && (
        <View style={styles.packCard}>
          <Text style={styles.packLabel}>Pack {pack.nom}</Text>
          <Text style={styles.packUsage}>
            {pack.utilises} / {pack.max === null ? '∞' : pack.max} technicien(s) utilisé(s)
          </Text>
          {pack.max !== null && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min((pack.utilises / pack.max) * 100, 100)}%` }]} />
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.addBtn, limiteAtteinte && styles.addBtnDisabled]}
        disabled={limiteAtteinte}
        onPress={() => navigation.navigate('AdminAddTechnicien')}
      >
        <Text style={styles.addBtnText}>
          {limiteAtteinte ? 'Limite du pack atteinte — contacte ton fournisseur' : '+ Ajouter un technicien'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={commerciaux}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.name}>{item.prenom} {item.nom}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <TouchableOpacity onPress={() => supprimer(item)}>
              <Text style={styles.remove}>Retirer</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun technicien pour le moment</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  packCard: { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 14, padding: 16 },
  packLabel: { fontWeight: '800', fontSize: 15, color: '#1a1a2e' },
  packUsage: { fontSize: 12.5, color: '#666', marginTop: 4, marginBottom: 8 },
  track: { height: 7, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#FF6B4A', borderRadius: 6 },
  addBtn: { backgroundColor: '#FF6B4A', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  name: { fontWeight: '700', fontSize: 14, color: '#1a1a2e' },
  email: { fontSize: 12, color: '#888', marginTop: 2 },
  remove: { color: '#dc2626', fontWeight: '700', fontSize: 12.5 },
  empty: { textAlign: 'center', color: '#999', marginTop: 30 },
});
