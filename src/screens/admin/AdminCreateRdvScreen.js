import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import client from '../../api/client';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import FormError from '../../components/FormError';

export default function AdminCreateRdvScreen({ navigation }) {
  const [commerciaux, setCommerciaux] = useState([]);
  const [clients, setClients] = useState([]);
  const [commercialId, setCommercialId] = useState(null);

  const [clientExistantId, setClientExistantId] = useState(null);
  const [nouveauClient, setNouveauClient] = useState({ nom: '', prenom: '', telephone: '', adresse: '' });

  const [dateHeure, setDateHeure] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');

  useEffect(() => {
    (async () => {
      const [commRes, clientRes] = await Promise.all([
        client.get('/admin/commerciaux'),
        client.get('/admin/clients'),
      ]);
      setCommerciaux(commRes.data.commerciaux || commRes.data);
      setClients(clientRes.data);
    })();
  }, []);

  const valider = () => {
    const e = {};
    if (!commercialId) e.commercial = 'Choisis le technicien à qui attribuer ce RDV';
    if (!clientExistantId) {
      if (!nouveauClient.prenom.trim()) e.prenom = 'Le prénom du client est obligatoire';
      if (!nouveauClient.nom.trim()) e.nom = 'Le nom du client est obligatoire';
    }
    if (!dateHeure.trim()) e.date = 'Indique la date et l\'heure du RDV';
    else if (isNaN(new Date(dateHeure.replace(' ', 'T')).getTime())) {
      e.date = 'Format non reconnu — utilise "2026-09-20 14:30"';
    }
    return e;
  };

  const creerRdv = async () => {
    setBanner('');
    const e = valider();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setBanner('Certains champs sont manquants ou incorrects — corrige-les ci-dessous.');
      return;
    }

    setLoading(true);
    try {
      let finalClientId = clientExistantId;

      if (!finalClientId) {
        const { data: createdClient } = await client.post('/admin/clients', { ...nouveauClient, commercialId });
        finalClientId = createdClient.id;
      }

      const isoDate = new Date(dateHeure.replace(' ', 'T')).toISOString();

      await client.post('/admin/rdv', {
        clientId: finalClientId,
        commercialId,
        dateHeure: isoDate,
        adresse: nouveauClient.adresse,
        notes,
      });

      Alert.alert('RDV créé', 'Le rendez-vous a été attribué et le commercial a été notifié.');
      navigation.goBack();
    } catch (err) {
      setBanner(err?.response?.data?.error || 'Impossible de créer le RDV. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <FormError message={banner} variant="banner" />

      <Text style={styles.label}>Commercial</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        {commerciaux.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, commercialId === c.id && styles.chipActive, errors.commercial && !commercialId && styles.chipError]}
            onPress={() => { setCommercialId(c.id); setErrors((e) => ({ ...e, commercial: null })); }}
          >
            <Text style={[styles.chipText, commercialId === c.id && styles.chipTextActive]}>{c.prenom} {c.nom}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FormError message={errors.commercial} />

      <Text style={styles.label}>Client existant (optionnel)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <TouchableOpacity
          style={[styles.chip, !clientExistantId && styles.chipActive]}
          onPress={() => setClientExistantId(null)}
        >
          <Text style={[styles.chipText, !clientExistantId && styles.chipTextActive]}>Nouveau client</Text>
        </TouchableOpacity>
        {clients.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, clientExistantId === c.id && styles.chipActive]}
            onPress={() => setClientExistantId(c.id)}
          >
            <Text style={[styles.chipText, clientExistantId === c.id && styles.chipTextActive]}>{c.prenom} {c.nom}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!clientExistantId && (
        <>
          <TextInput
            style={[styles.input, errors.prenom && styles.inputError]}
            placeholder="Prénom du client"
            value={nouveauClient.prenom}
            onChangeText={(v) => { setNouveauClient((f) => ({ ...f, prenom: v })); setErrors((e) => ({ ...e, prenom: null })); }}
          />
          <FormError message={errors.prenom} />

          <TextInput
            style={[styles.input, errors.nom && styles.inputError]}
            placeholder="Nom du client"
            value={nouveauClient.nom}
            onChangeText={(v) => { setNouveauClient((f) => ({ ...f, nom: v })); setErrors((e) => ({ ...e, nom: null })); }}
          />
          <FormError message={errors.nom} />

          <TextInput style={styles.input} placeholder="Téléphone" value={nouveauClient.telephone} onChangeText={(v) => setNouveauClient((f) => ({ ...f, telephone: v }))} keyboardType="phone-pad" />
        </>
      )}

      <AddressAutocomplete
        placeholder="Adresse du RDV"
        value={nouveauClient.adresse}
        onChange={(v) => setNouveauClient((f) => ({ ...f, adresse: v }))}
      />

      <TextInput
        style={[styles.input, errors.date && styles.inputError]}
        placeholder="Date et heure (ex: 2026-09-20 14:30)"
        value={dateHeure}
        onChangeText={(v) => { setDateHeure(v); setErrors((e) => ({ ...e, date: null })); }}
      />
      <FormError message={errors.date} />

      <TextInput style={[styles.input, { height: 80 }]} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.button} onPress={creerRdv} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Création...' : 'Créer et attribuer le RDV'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 8, textTransform: 'uppercase' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  chipActive: { backgroundColor: '#FF6B4A' },
  chipError: { borderWidth: 1.5, borderColor: '#DC2626' },
  chipText: { color: '#555', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  button: { backgroundColor: '#FF6B4A', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
