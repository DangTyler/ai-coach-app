import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

interface ConfettiEffectProps {
  trigger: boolean;
  intensity?: 'small' | 'medium' | 'large';
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

const COLORS = [
  '#FF3B5C', // vibrant red
  '#FF6B35', // bright orange
  '#FFD93D', // golden yellow
  '#6BCB77', // fresh green
  '#4D96FF', // electric blue
  '#9B5DE5', // vivid purple
  '#F72585', // hot pink
  '#00F5D4', // cyan
  '#FEE440', // lemon
  '#FF85A1', // coral pink
  '#7209B7', // deep purple
  '#3A86FF', // royal blue
];

const SHAPES = ['square', 'rectangle', 'circle', 'ribbon'] as const;

interface Particle {
  id: number;
  color: string;
  shape: typeof SHAPES[number];
  size: number;
  startX: number;
  startY: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  wobblePhase: number;
  wobbleCycles: number;
  wobbleAmplitude: number;
  wave: number;
}

function createParticles(count: number, wave: number = 0): Particle[] {
  const particles: Particle[] = [];
  const centerX = width / 2;
  const centerY = height * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 400 + Math.random() * 500;
    const spreadFactor = 0.4 + Math.random() * 0.6;
    
    particles.push({
      id: i + (wave * 1000),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 10 + Math.random() * 12,
      startX: centerX + (Math.random() - 0.5) * 60,
      startY: centerY + (Math.random() - 0.5) * 40,
      velocityX: Math.cos(angle) * speed * spreadFactor,
      velocityY: Math.sin(angle) * speed - 350,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1080,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleCycles: 1 + Math.random() * 1.5,
      wobbleAmplitude: 15 + Math.random() * 25,
      wave,
    });
  }
  return particles;
}

interface ConfettiParticleProps {
  particle: Particle;
  progress: Animated.Value;
}

const ConfettiParticle = React.memo(function ConfettiParticle({ particle, progress }: ConfettiParticleProps) {
  const gravity = 900;
  const duration = 3000;
  
  const baseXDisplacement = particle.velocityX * (duration / 1000);
  
  const driftValues = useMemo(() => {
    const steps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    return steps.map(t => {
      const baseX = baseXDisplacement * t;
      const sineWave = Math.sin(t * particle.wobbleCycles * Math.PI * 2 + particle.wobblePhase);
      const amplitudeGrowth = 0.3 + t * 0.7;
      const drift = sineWave * particle.wobbleAmplitude * amplitudeGrowth;
      return baseX + drift;
    });
  }, [baseXDisplacement, particle.wobbleCycles, particle.wobblePhase, particle.wobbleAmplitude]);
  
  const translateX = progress.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: driftValues,
  });
  
  const translateY = progress.interpolate({
    inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
    outputRange: [
      0,
      particle.velocityY * 0.15 * (duration / 1000) + 0.5 * gravity * Math.pow(0.15 * (duration / 1000), 2),
      particle.velocityY * 0.3 * (duration / 1000) + 0.5 * gravity * Math.pow(0.3 * (duration / 1000), 2),
      particle.velocityY * 0.45 * (duration / 1000) + 0.5 * gravity * Math.pow(0.45 * (duration / 1000), 2),
      particle.velocityY * 0.6 * (duration / 1000) + 0.5 * gravity * Math.pow(0.6 * (duration / 1000), 2),
      particle.velocityY * 0.75 * (duration / 1000) + 0.5 * gravity * Math.pow(0.75 * (duration / 1000), 2),
      particle.velocityY * 0.9 * (duration / 1000) + 0.5 * gravity * Math.pow(0.9 * (duration / 1000), 2),
      particle.velocityY * 1.0 * (duration / 1000) + 0.5 * gravity * Math.pow(1.0 * (duration / 1000), 2),
    ],
  });
  
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${particle.rotation}deg`, `${particle.rotation + particle.rotationSpeed}deg`],
  });
  
  const rotateY = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '180deg', '360deg', '540deg', '720deg'],
  });
  
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });
  
  const scale = progress.interpolate({
    inputRange: [0, 0.08, 0.15, 0.85, 1],
    outputRange: [0, 1.3, 1, 1, 0.3],
  });

  const shapeStyle = useMemo(() => {
    switch (particle.shape) {
      case 'circle':
        return { borderRadius: particle.size / 2, width: particle.size, height: particle.size };
      case 'rectangle':
        return { width: particle.size * 0.4, height: particle.size * 1.8, borderRadius: 2 };
      case 'ribbon':
        return { width: particle.size * 0.3, height: particle.size * 2.2, borderRadius: particle.size * 0.15 };
      default:
        return { width: particle.size, height: particle.size, borderRadius: 2 };
    }
  }, [particle.shape, particle.size]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.startX,
          top: particle.startY,
          backgroundColor: particle.color,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { rotateY },
            { scale },
          ],
        },
        shapeStyle,
      ]}
    />
  );
});

export default function ConfettiEffect({ trigger, intensity = 'medium', onComplete }: ConfettiEffectProps) {
  const progress1 = useRef(new Animated.Value(0)).current;
  const progress2 = useRef(new Animated.Value(0)).current;
  const [showWave2, setShowWave2] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const particleCount = intensity === 'small' ? 50 : intensity === 'large' ? 150 : 100;
  const wave2Count = intensity === 'small' ? 30 : intensity === 'large' ? 100 : 60;
  const duration = 3000;
  
  const particles1 = useMemo(() => {
    if (isVisible) {
      return createParticles(particleCount, 0);
    }
    return [];
  }, [isVisible, particleCount]);
  
  const particles2 = useMemo(() => {
    if (showWave2) {
      return createParticles(wave2Count, 1);
    }
    return [];
  }, [showWave2, wave2Count]);

  const stopAllAnimations = useCallback(() => {
    animationsRef.current.forEach(anim => anim.stop());
    animationsRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (trigger) {
      stopAllAnimations();
      
      progress1.setValue(0);
      progress2.setValue(0);
      setShowWave2(false);
      setIsVisible(true);
      
      const wave1Anim = Animated.timing(progress1, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      });
      animationsRef.current.push(wave1Anim);
      wave1Anim.start();
      
      timerRef.current = setTimeout(() => {
        setShowWave2(true);
        const wave2Anim = Animated.timing(progress2, {
          toValue: 1,
          duration: duration - 300,
          useNativeDriver: true,
        });
        animationsRef.current.push(wave2Anim);
        wave2Anim.start(() => {
          onComplete?.();
        });
      }, 300);
      
      const cleanupTimer = setTimeout(() => {
        setIsVisible(false);
        setShowWave2(false);
        stopAllAnimations();
      }, duration + 100);
      
      return () => {
        clearTimeout(cleanupTimer);
        stopAllAnimations();
      };
    } else {
      stopAllAnimations();
      setIsVisible(false);
      setShowWave2(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (!isVisible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles1.map((particle) => (
        <ConfettiParticle
          key={`w1-${particle.id}`}
          particle={particle}
          progress={progress1}
        />
      ))}
      {showWave2 && particles2.map((particle) => (
        <ConfettiParticle
          key={`w2-${particle.id}`}
          particle={particle}
          progress={progress2}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});
