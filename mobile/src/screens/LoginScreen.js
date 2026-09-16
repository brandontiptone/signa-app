import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import FormError from '../components/FormError';

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>Connecte-toi à ton espace commercial</Text>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  button: { backgroundColor: '#FF6B4A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#888', textAlign: 'center', marginTop: 20, fontSize: 13 },
});
