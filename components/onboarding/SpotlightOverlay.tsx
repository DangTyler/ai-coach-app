import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface SpotlightOverlayProps {
  isVisible?: boolean;
  target?: { x: number; y: number; width: number; height: number } | null;
  tooltip?: string;
  onComplete?: () => void;
}

export default function SpotlightOverlay({ 
  isVisible = false,
  target,
  tooltip = '',
  onComplete = () => {} 
}: SpotlightOverlayProps = {}) {
  const isActive = isVisible;
  const spotlightTarget = target;
  const tooltipText = tooltip;
  const handleComplete = onComplete;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive, pulseAnim]);

  if (!isActive || !spotlightTarget) return null;

  const { x, y, width: targetWidth, height: targetHeight } = spotlightTarget;

  return (
    <TouchableWithoutFeedback onPress={handleComplete}>
      <View style={styles.container}>
        {/* Dark overlay with cutout */}
        <View style={styles.overlay}>
          {/* Top */}
          <View style={[styles.darkArea, { height: y }]} />
          
          {/* Middle section with cutout */}
          <View style={styles.middleRow}>
            <View style={[styles.darkArea, { width: x }]} />
            
            {/* Spotlight cutout */}
            <View
              style={[
                styles.cutout,
                {
                  width: targetWidth + 20,
                  height: targetHeight + 20,
                  marginTop: -10,
                  marginLeft: -10,
                },
              ]}
            >
              {/* Pulsing border */}
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            </View>
            
            <View style={[styles.darkArea, { flex: 1 }]} />
          </View>
          
          {/* Bottom */}
          <View style={[styles.darkArea, { flex: 1 }]} />
        </View>

        {/* Tooltip */}
        <View
          style={[
            styles.tooltip,
            {
              top: y + targetHeight + 20,
              left: 24,
              right: 24,
            },
          ]}
        >
          <View style={styles.tooltipArrow} />
          <Text style={styles.tooltipText}>{tooltipText}</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  darkArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: '100%',
  },
  middleRow: {
    flexDirection: 'row',
  },
  cutout: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
    opacity: 0.5,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  tooltipArrow: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: Colors.white,
    transform: [{ rotate: '45deg' }],
  },
  tooltipText: {
    fontSize: 16,
    color: Colors.navy,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
