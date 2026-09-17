import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// Petit badge qui tourne en continu sur lui-même (effet 3D), comme les cubes
// flottants du prototype. `color` = couleur de fond, `icon` = emoji/texte au centre.
export default function Spin3DBadge({ color = '#FF6B4A', icon = '🔧', size = 34, style, duration = 3200 }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration, useNativeDriver: true })
    ).start();
  }, []);

  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.55, 1] });

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.face,
          { width: size, height: size, backgroundColor: color, transform: [{ perspective: 500 }, { rotateY }, { scaleX: scale }] },
        ]}
      >
        <Text style={{ fontSize: size * 0.45 }}>{icon}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  face: {
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(27,35,64,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
