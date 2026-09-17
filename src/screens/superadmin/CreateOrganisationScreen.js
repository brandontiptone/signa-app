import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import client from '../../api/client';
import FormError from '../../components/FormError';

export default function CreateOrganisationScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(null);
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [adminNom, setAdminNom] = useState('');
  const [adminPrenom, setAdminPrenom] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');

  useEffect(() => {
    client.get('/superadmin/plans').then(({ data }) => setPlans(data));
  }, []);

  const emailValide = (v) => /\S+@\S+\.\S+/.test(v);

  const valider = () => {
    const e = {};
    if (!nomEntreprise.trim()) e.nomEntreprise = "Le nom de l'entreprise est obligatoire";
    if (!planId) e.plan = 'Choisis un pack avant de continuer';
    if (!adminPrenom.trim()) e.adminPrenom = 'Le prénom est obligatoire';
    if (!adminNom.trim()) e.adminNom = 'Le nom est obligatoire';
    if (!adminEmail.trim()) e.adminEmail = "L'email est obligatoire";
    else if (!emailValide(adminEmail)) e.adminEmail = "Cet email n'a pas un format valide";
    if (!adminPassword) e.adminPassword = 'Le mot de passe est obligatoire';
    else if (adminPassword.length < 6) e.adminPassword = 'Minimum 6 caractères';
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
      await client.post('/superadmin/organisations', {
        nomEntreprise, planId, adminNom, adminPrenom, adminEmail, adminPassword,
      });
      Alert.alert(
        'Entreprise créée',
        `Transmets ces identifiants à ${adminPrenom} :\nEmail : ${adminEmail}\nMot de passe : ${adminPassword}`
      );
      navigation.goBack();
    } catch (err) {
      // Erreur venant du serveur (ex : email déjà utilisé) → bandeau rouge, pas de popup
      setBanner(err?.response?.data?.error || "Impossible de créer l'entreprise. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FormError message={banner} variant="banner" />

      <Text style={styles.label}>Nom de l'entreprise</Text>
      <TextInput
        style={[styles.input, errors.nomEntreprise && styles.inputError]}
        placeholder="Ex : Isolation+ Reims"
        value={nomEntreprise}
        onChangeText={(v) => { setNomEntreprise(v); setErrors((e) => ({ ...e, nomEntreprise: null })); }}
      />
      <FormError message={errors.nomEntreprise} />

      <Text style={styles.label}>Choix du pack</Text>
      {plans.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={[styles.pack, planId === p.id && styles.packSelected, errors.plan && !planId && styles.packError]}
          onPress={() => { setPlanId(p.id); setErrors((e) => ({ ...e, plan: null })); }}
        >
          <View style={styles.packTop}>
            <Text style={styles.packName}>{p.nom}</Text>
            <Text style={styles.packPrice}>{p.prixMensuel.toFixed(2)} €/mois</Text>
          </View>
          <Text style={styles.packDesc}>
            {p.maxTechniciens === null ? 'Techniciens illimités' : `Jusqu'à ${p.maxTechniciens} techniciens`}
          </Text>
        </TouchableOpacity>
      ))}
      <FormError message={errors.plan} />

      <Text style={styles.label}>Premier compte admin</Text>
      <TextInput
        style={[styles.input, errors.adminPrenom && styles.inputError]}
        placeholder="Prénom de l'admin"
        value={adminPrenom}
        onChangeText={(v) => { setAdminPrenom(v); setErrors((e) => ({ ...e, adminPrenom: null })); }}
      />
      <FormError message={errors.adminPrenom} />

      <TextInput
        style={[styles.input, errors.adminNom && styles.inputError]}
        placeholder="Nom de l'admin"
        value={adminNom}
        onChangeText={(v) => { setAdminNom(v); setErrors((e) => ({ ...e, adminNom: null })); }}
      />
      <FormError message={errors.adminNom} />

      <TextInput
        style={[styles.input, errors.adminEmail && styles.inputError]}
        placeholder="Email de connexion"
        autoCapitalize="none"
        value={adminEmail}
        onChangeText={(v) => { setAdminEmail(v); setErrors((e) => ({ ...e, adminEmail: null })); }}
        keyboardType="email-address"
      />
      <FormError message={errors.adminEmail} />

      <TextInput
        style={[styles.input, errors.adminPassword && styles.inputError]}
        placeholder="Mot de passe temporaire"
        secureTextEntry
        value={adminPassword}
        onChangeText={(v) => { setAdminPassword(v); setErrors((e) => ({ ...e, adminPassword: null })); }}
      />
      <FormError message={errors.adminPassword} />

      <TouchableOpacity style={styles.button} onPress={creer} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Création...' : "Créer l'entreprise et son accès admin"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 12, fontWeight: '700', color: '#1a1a2e', textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 15 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  pack: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, padding: 13, marginBottom: 9 },
  packSelected: { borderColor: '#FF6B4A', backgroundColor: '#FFE8E1' },
  packError: { borderColor: '#DC2626' },
  packTop: { flexDirection: 'row', justifyContent: 'space-between' },
  packName: { fontWeight: '800', fontSize: 14 },
  packPrice: { fontWeight: '800', fontSize: 14, color: '#E8522F' },
  packDesc: { fontSize: 12, color: '#888', marginTop: 3 },
  button: { backgroundColor: '#FF6B4A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
