import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

interface ConfettiEffectProps {
  trigger: boolean;
  intensity?: 'small' | 'medium' | 'large';
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

// Simple confetti animation using Lottie
// Using a simple celebration animation JSON
const confettiAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 180,
  w: 500,
  h: 500,
  nm: "Confetti",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Shape Layer 1",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [250, 250, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: []
    }
  ]
};

export default function ConfettiEffect({ trigger, intensity = 'medium', onComplete }: ConfettiEffectProps) {
  const animationRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      animationRef.current?.play();

      const duration = intensity === 'small' ? 1500 : intensity === 'large' ? 3000 : 2000;
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onComplete?.();
        });
      }, duration);
    }
  }, [trigger, intensity, onComplete, fadeAnim]);

  if (!trigger) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LottieView
        ref={animationRef}
        source={confettiAnimation as any}
        style={[
          styles.lottie,
          intensity === 'small' && styles.small,
          intensity === 'large' && styles.large,
        ]}
        autoPlay={false}
        loop={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  },
  lottie: {
    width: width,
    height: height,
  },
  small: {
    width: width * 0.6,
    height: height * 0.6,
  },
  large: {
    width: width * 1.2,
    height: height * 1.2,
  },
});
