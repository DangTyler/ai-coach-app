import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Rocket, Award, Flame } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import { onboardingStorage } from '../storage';
import ProgressBar from '@/components/onboarding/ProgressBar';
import XPAnimation from '@/components/onboarding/XPAnimation';
import ConfettiEffect from '@/components/onboarding/ConfettiEffect';
import Colors from '@/constants/colors';

export default function CompleteStep() {
  const { currentStep, totalSteps, xp, data, completeOnboarding } = useOnboarding();
  const router = useRouter();
  
  const [showConfetti, setShowConfetti] = useState(true);
  const [displayXp, setDisplayXp] = useState(0);
  const [showXp, setShowXp] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const flamePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Celebration haptics
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 300);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);

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

    // XP counter roll up
    const totalXp = xp || 130; // Default to 130 if not tracked
    const duration = 2000;
    const steps = 60;
    const increment = totalXp / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= totalXp) {
        setDisplayXp(totalXp);
        clearInterval(interval);
        setShowXp(true);
        setTimeout(() => setShowXp(false), 1500);
      } else {
        setDisplayXp(Math.floor(current));
      }
    }, duration / steps);

    // Flame pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flamePulse, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(flamePulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [xp, fadeAnim, slideAnim, flamePulse]);

  const handleStart = async () => {
    // Button bounce
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 4,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Complete onboarding
    await completeOnboarding();

    // Navigate to main app
    setTimeout(() => {
      setShowConfetti(false);
      router.replace('/(tabs)/(library)');
    }, 300);
  };

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
        <View style={styles.iconContainer}>
          <Rocket color={Colors.accent} size={56} />
        </View>

        <Text style={styles.title}>You're all set! 🚀</Text>
        <Text style={styles.subtitle}>
          {data.name ? `${data.name}, y` : 'Y'}ou're ready to start your journey
        </Text>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.xpBadge}>
              <Text style={styles.xpValue}>{displayXp}</Text>
              <Text style={styles.xpLabel}>XP Earned</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badgeItem}>
              <View style={styles.badgeIcon}>
                <Award color={Colors.accent} size={24} />
              </View>
              <Text style={styles.badgeText}>1 Badge</Text>
            </View>

            <View style={styles.badgeItem}>
              <Animated.View 
                style={[
                  styles.badgeIcon,
                  { transform: [{ scale: flamePulse }] },
                ]}
              >
                <Flame color={Colors.accent} size={24} />
              </Animated.View>
              <Text style={styles.badgeText}>3 Day Streak</Text>
            </View>
          </View>
        </View>

        <XPAnimation 
          amount={displayXp} 
          trigger={showXp} 
          y={-20}
        />
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Start Learning</Text>
        </TouchableOpacity>
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  summaryContainer: {
    width: '100%',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  xpBadge: {
    alignItems: 'center',
  },
  xpValue: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.accent,
  },
  xpLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  badgeItem: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
  },
  button: {
    backgroundColor: Colors.navy,
    margin: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
