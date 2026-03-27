import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Colors from '@/constants/colors';

interface SparkleEffectProps {
  trigger: boolean;
  count?: number;
}

export default function SparkleEffect({ trigger, count = 5 }: SparkleEffectProps) {
  const sparkles = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (trigger) {
      sparkles.forEach((sparkle, index) => {
        const delay = index * 100;
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;

        sparkle.translateX.setValue(0);
        sparkle.translateY.setValue(0);

        setTimeout(() => {
          Animated.parallel([
            Animated.sequence([
              Animated.timing(sparkle.opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(sparkle.opacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.spring(sparkle.scale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 4,
              }),
              Animated.timing(sparkle.scale, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(sparkle.translateX, {
                toValue: x,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(sparkle.translateY, {
                toValue: y,
                duration: 600,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, delay);
      });
    }
  }, [trigger, sparkles]);

  if (!trigger) return null;

  return (
    <View style={styles.container}>
      {sparkles.map((sparkle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.sparkle,
            {
              opacity: sparkle.opacity,
              transform: [
                { scale: sparkle.scale },
                { translateX: sparkle.translateX },
                { translateY: sparkle.translateY },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    pointerEvents: 'none',
  },
  sparkle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    position: 'absolute',
  },
});
