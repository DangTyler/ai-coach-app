import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

interface ConfettiEffectProps {
  trigger: boolean;
  intensity?: 'small' | 'medium' | 'large';
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

const COLORS = [
  '#FF6B6B', // coral red
  '#4ECDC4', // teal
  '#FFE66D', // yellow
  '#95E1D3', // mint
  '#F38181', // pink
  '#AA96DA', // lavender
  '#FCBAD3', // light pink
  '#A8D8EA', // light blue
  '#FF9F43', // orange
  '#6C5CE7', // purple
];

const SHAPES = ['square', 'rectangle', 'circle'] as const;

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
}

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  const centerX = width / 2;
  const centerY = height * 0.4;

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 300 + Math.random() * 400;
    
    particles.push({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 8 + Math.random() * 8,
      startX: centerX,
      startY: centerY,
      velocityX: Math.cos(angle) * speed * (0.3 + Math.random() * 0.7),
      velocityY: Math.sin(angle) * speed - 200,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
    });
  }
  return particles;
}

interface ConfettiParticleProps {
  particle: Particle;
  progress: Animated.Value;
}

function ConfettiParticle({ particle, progress }: ConfettiParticleProps) {
  const gravity = 800;
  const duration = 2500;
  
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, particle.velocityX * (duration / 1000)],
  });
  
  const translateY = progress.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      0,
      particle.velocityY * 0.2 * (duration / 1000) + 0.5 * gravity * Math.pow(0.2 * (duration / 1000), 2),
      particle.velocityY * 0.4 * (duration / 1000) + 0.5 * gravity * Math.pow(0.4 * (duration / 1000), 2),
      particle.velocityY * 0.6 * (duration / 1000) + 0.5 * gravity * Math.pow(0.6 * (duration / 1000), 2),
      particle.velocityY * 0.8 * (duration / 1000) + 0.5 * gravity * Math.pow(0.8 * (duration / 1000), 2),
      particle.velocityY * 1.0 * (duration / 1000) + 0.5 * gravity * Math.pow(1.0 * (duration / 1000), 2),
    ],
  });
  
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${particle.rotation}deg`, `${particle.rotation + particle.rotationSpeed}deg`],
  });
  
  const opacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  
  const scale = progress.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0.5],
  });

  const shapeStyle = useMemo(() => {
    switch (particle.shape) {
      case 'circle':
        return { borderRadius: particle.size / 2 };
      case 'rectangle':
        return { width: particle.size * 0.5, height: particle.size * 1.5 };
      default:
        return {};
    }
  }, [particle.shape, particle.size]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.startX,
          top: particle.startY,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scale },
          ],
        },
        shapeStyle,
      ]}
    />
  );
}

export default function ConfettiEffect({ trigger, intensity = 'medium', onComplete }: ConfettiEffectProps) {
  const progress = useRef(new Animated.Value(0)).current;
  
  const particleCount = intensity === 'small' ? 30 : intensity === 'large' ? 80 : 50;
  const duration = intensity === 'small' ? 2000 : intensity === 'large' ? 3000 : 2500;
  
  const particles = useMemo(() => {
    if (trigger) {
      return createParticles(particleCount);
    }
    return [];
  }, [trigger, particleCount]);

  useEffect(() => {
    if (trigger) {
      progress.setValue(0);
      
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    }
  }, [trigger, duration, onComplete, progress]);

  if (!trigger) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          particle={particle}
          progress={progress}
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
    borderRadius: 2,
  },
});
