import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import client from '../../api/client';
import FormError from '../../components/FormError';

export default function AdminAddTechnicienScreen({ navigation }) {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');

  const update = (key) => (val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const emailValide = (v) => /\S+@\S+\.\S+/.test(v);

  const valider = () => {
    const e = {};
    if (!form.prenom.trim()) e.prenom = 'Le prénom est obligatoire';
    if (!form.nom.trim()) e.nom = 'Le nom est obligatoire';
    if (!form.email.trim()) e.email = "L'email est obligatoire";
    else if (!emailValide(form.email)) e.email = "Cet email n'a pas un format valide";
    if (!form.password) e.password = 'Le mot de passe est obligatoire';
    else if (form.password.length < 6) e.password = 'Minimum 6 caractères';
    return e;
  };

  const creer = async () => {
    setBanner('');
    const e = valider();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setBanner('Certains champs sont manquants ou incorrects — corrige-les ci-dessous.');
      return;
    }

    setLoading(true);
    try {
      await client.post('/admin/commerciaux', form);
      Alert.alert('Technicien ajouté', `Transmets ces identifiants à ${form.prenom} : ${form.email}`);
      navigation.goBack();
    } catch (err) {
      const data = err?.response?.data;
      // Cas spécial : limite du pack atteinte → message rouge explicite plutôt qu'une erreur générique
      setBanner(data?.message || data?.error || "Impossible de créer ce compte. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nouveau technicien</Text>
      <Text style={styles.sub}>Ce compte compte dans le quota de ton pack</Text>

      <FormError message={banner} variant="banner" />

      <TextInput style={[styles.input, errors.prenom && styles.inputError]} placeholder="Prénom" value={form.prenom} onChangeText={update('prenom')} />
      <FormError message={errors.prenom} />

      <TextInput style={[styles.input, errors.nom && styles.inputError]} placeholder="Nom" value={form.nom} onChangeText={update('nom')} />
      <FormError message={errors.nom} />

      <TextInput style={styles.input} placeholder="Téléphone (optionnel)" value={form.telephone} onChangeText={update('telephone')} keyboardType="phone-pad" />

      <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email de connexion" autoCapitalize="none" value={form.email} onChangeText={update('email')} keyboardType="email-address" />
      <FormError message={errors.email} />

      <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="Mot de passe temporaire" secureTextEntry value={form.password} onChangeText={update('password')} />
      <FormError message={errors.password} />

      <TouchableOpacity style={styles.button} onPress={creer} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Création...' : 'Créer le compte technicien'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 21, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  sub: { fontSize: 12.5, color: '#888', marginBottom: 16 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 15 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  button: { backgroundColor: '#FF6B4A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
