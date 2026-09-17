import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import FormError from '../components/FormError';
import Mascot from '../components/Mascot';
import Logo from '../components/Logo';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState('');

  const handleLogin = async () => {
    setBanner('');
    if (!email || !password) {
      setBanner('Renseigne ton email et ton mot de passe pour te connecter.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const data = err?.response?.data;
      setBanner(data?.message || data?.error || 'Identifiants incorrects. Vérifie ton email et ton mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Logo size={40} />
          <Mascot size={110} />
          <Text style={styles.title}>Bienvenue</Text>
          <Text style={styles.subtitle}>Connecte-toi à ton espace terrain</Text>
        </View>

        <View style={styles.card}>
          <FormError message={banner} variant="banner" />

          <TextInput
            style={[styles.input, banner && styles.inputError]}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => { setEmail(v); setBanner(''); }}
          />
          <TextInput
            style={[styles.input, banner && styles.inputError]}
            placeholder="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={(v) => { setPassword(v); setBanner(''); }}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <Text style={styles.link}>Pas de compte ? Contacte ton administrateur.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  hero: { backgroundColor: '#1B2340', alignItems: 'center', paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 10 },
  subtitle: { fontSize: 12.5, color: '#C9CCE0', marginTop: 3 },
  card: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 28 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  button: { backgroundColor: '#FF6B4A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#888', textAlign: 'center', marginTop: 20, fontSize: 13 },
});
