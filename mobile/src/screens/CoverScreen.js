import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Mascot from '../components/Mascot';
import HalftoneBackground from '../components/HalftoneBackground';
import Spin3DBadge from '../components/Spin3DBadge';
import Logo from '../components/Logo';

const { width, height } = Dimensions.get('window');
const MASCOT_SIZE = Math.min(width * 0.56, 230);

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
    <LinearGradient colors={['#1B2340', '#262C4A']} style={{ flex: 1 }}>
      <HalftoneBackground width={width} height={height} opacity={0.3} />

      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.brandRow}>
          <Logo size={34} />
          <Text style={styles.brandName}>Signa</Text>
        </View>

        <View style={styles.mascotWrap}>
          <Spin3DBadge color="#FF6B4A" icon="🔧" size={36} style={styles.badgeTopLeft} duration={3000} />
          <Spin3DBadge color="#1F9D6B" icon="✓" size={30} style={styles.badgeBottomRight} duration={3800} />

          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <Mascot size={MASCOT_SIZE} />
          </Animated.View>
        </View>

        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>Prêt pour la tournée du jour ?</Text>
        </View>

        <Text style={styles.welcome}>Bienvenue sur Signa</Text>
        <Text style={styles.subtitle}>Planning, visites et dossiers clients — tout au même endroit, pensé pour l'action.</Text>

        <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.ctaText}>Découvrir l'application</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 20, paddingHorizontal: 24, paddingBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 9, marginBottom: 6, zIndex: 3 },
  brandMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FF6B4A', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  brandName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  mascotWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  badgeTopLeft: { position: 'absolute', top: '18%', left: '10%', zIndex: 2 },
  badgeBottomRight: { position: 'absolute', bottom: '20%', right: '8%', zIndex: 2 },
  bubble: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, zIndex: 3 },
  bubbleText: { color: '#1B2340', fontWeight: '700', fontSize: 13 },
  welcome: { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 8, zIndex: 3 },
  subtitle: { color: '#C9CCE0', fontSize: 13, textAlign: 'center', marginBottom: 22, paddingHorizontal: 8, lineHeight: 19, zIndex: 3 },
  cta: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 40, width: '100%', alignItems: 'center', zIndex: 3 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
