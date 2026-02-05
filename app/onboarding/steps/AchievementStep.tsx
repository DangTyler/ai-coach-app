import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Award } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';
import XPAnimation from '@/components/onboarding/XPAnimation';
import ConfettiEffect from '@/components/onboarding/ConfettiEffect';
import Colors from '@/constants/colors';

export default function AchievementStep() {
  const { nextStep, currentStep, totalSteps, addXp } = useOnboarding();
  
  const [showXp, setShowXp] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(true);
  
  const badgeScale = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Trigger haptics celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);

    // Badge pop animation
    Animated.spring(badgeScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();

    // Content fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();

    // Add XP and show popup
    setTimeout(() => {
      addXp(50);
      setShowXp(true);
    }, 500);

    // Auto advance after celebration
    setTimeout(() => {
      setShowConfetti(false);
      setShowXp(false);
      nextStep();
    }, 3500);
  }, [badgeScale, fadeAnim, slideAnim, addXp, nextStep]);

  return (
    <View style={styles.container}>
      <ConfettiEffect 
        trigger={showConfetti} 
        intensity="large"
      />
      
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.congratsText}>🎉 Congratulations!</Text>

        <Animated.View
          style={[
            styles.badgeContainer,
            {
              transform: [{ scale: badgeScale }],
            },
          ]}
        >
          <View style={styles.badge}>
            <Award color={Colors.accent} size={64} />
          </View>
          <View style={styles.badgeGlow} />
        </Animated.View>

        <Text style={styles.badgeTitle}>Quick Learner</Text>
        <Text style={styles.badgeDescription}>
          Badge Unlocked!
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Badge Earned</Text>
          </View>
        </View>

        <XPAnimation 
          amount={50} 
          trigger={showXp} 
          y={20}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 32,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  badge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 2,
  },
  badgeGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.accent + '30',
    zIndex: 1,
  },
  badgeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
