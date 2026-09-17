import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Mascot from '../components/Mascot';

const { width } = Dimensions.get('window');
const MASCOT_SIZE = Math.min(width * 0.58, 240);

export default function CoverScreen({ navigation }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2100, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={['#1B2340', '#262C4A']} style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
        <Text style={styles.brandName}>Signa</Text>
      </View>

      <View style={styles.mascotWrap}>
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <Mascot size={MASCOT_SIZE} />
        </Animated.View>
      </View>

      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>Prêt pour la tournée du jour ?</Text>
      </View>

      <Text style={styles.title}>Ton terrain, simplifié</Text>
      <Text style={styles.subtitle}>Planning, visites et dossiers clients — tout au même endroit, pensé pour l'action.</Text>

      <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.ctaText}>Découvrir l'application</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 70, paddingHorizontal: 24, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 9, marginBottom: 10 },
  brandMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FF6B4A', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  brandName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  mascotWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 14 },
  bubbleText: { color: '#1B2340', fontWeight: '700', fontSize: 13 },
  title: { color: '#fff', fontSize: 25, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: '#C9CCE0', fontSize: 13, textAlign: 'center', marginBottom: 22, paddingHorizontal: 8, lineHeight: 19 },
  cta: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
