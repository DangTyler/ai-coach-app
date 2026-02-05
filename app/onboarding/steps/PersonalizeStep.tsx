import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Sparkles, MessageSquare, Trophy, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';
import XPAnimation from '@/components/onboarding/XPAnimation';
import SparkleEffect from '@/components/onboarding/SparkleEffect';
import Colors from '@/constants/colors';

export default function PersonalizeStep() {
  const { nextStep, currentStep, totalSteps, data, addXp } = useOnboarding();
  
  const [showXp, setShowXp] = React.useState(false);
  const [showSparkles, setShowSparkles] = React.useState(false);
  
  const fadeAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;
  const slideAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(30))
  ).current;

  useEffect(() => {
    // Staggered entrance animations
    fadeAnims.forEach((fadeAnim, index) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnims[index], {
          toValue: 0,
          delay: index * 100,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();
    });

    // Trigger XP and sparkles after animations
    setTimeout(() => {
      setShowSparkles(true);
      addXp(25);
      setShowXp(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 500);

    setTimeout(() => {
      setShowXp(false);
    }, 2000);

    // Auto advance
    setTimeout(() => {
      setShowSparkles(false);
      nextStep();
    }, 3500);
  }, [fadeAnims, slideAnims, addXp, nextStep]);

  const features = [
    { icon: MessageSquare, label: 'AI Coaches', color: Colors.accent },
    { icon: Trophy, label: 'Achievements', color: Colors.success },
    { icon: Target, label: 'Daily Goals', color: Colors.warning },
    { icon: Sparkles, label: 'Personalized', color: Colors.navy },
  ];

  return (
    <View style={styles.container}>
      <SparkleEffect trigger={showSparkles} count={10} />
      
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: fadeAnims[0],
            transform: [{ translateY: slideAnims[0] }],
          }}
        >
          <Text style={styles.title}>
            We made this just for you{data.name ? `, ${data.name}` : ''}!
          </Text>
          <Text style={styles.subtitle}>
            Your personalized dashboard is ready
          </Text>
        </Animated.View>

        {/* Dashboard Preview */}
        <View style={styles.dashboardContainer}>
          {/* Header Card */}
          <Animated.View
            style={[
              styles.headerCard,
              {
                opacity: fadeAnims[1],
                transform: [{ translateY: slideAnims[1] }],
              },
            ]}
          >
            <Text style={styles.welcomeText}>
              Welcome back{data.name ? `, ${data.name}` : ''}!
            </Text>
            <Text style={styles.goalText}>
              Ready to {data.goal || 'learn'} today?
            </Text>
          </Animated.View>

          {/* Feature Cards Grid */}
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Animated.View
                  key={feature.label}
                  style={[
                    styles.featureCard,
                    {
                      opacity: fadeAnims[index + 2],
                      transform: [{ translateY: slideAnims[index + 2] }],
                    },
                  ]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                    <IconComponent color={feature.color} size={24} />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </Animated.View>
              );
            })}
          </View>

          {/* Path Indicator */}
          <Animated.View
            style={[
              styles.pathContainer,
              {
                opacity: fadeAnims[6],
                transform: [{ translateY: slideAnims[6] }],
              },
            ]}
          >
            <View style={styles.pathLine} />
            <View style={styles.pathNodes}>
              {[1, 2, 3].map((node) => (
                <View key={node} style={styles.pathNode}>
                  <View style={styles.nodeDot} />
                </View>
              ))}
            </View>
            <Text style={styles.pathText}>Your learning path awaits!</Text>
          </Animated.View>
        </View>

        <XPAnimation 
          amount={25} 
          trigger={showXp} 
          y={50}
        />
      </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  dashboardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  headerCard: {
    backgroundColor: Colors.navy,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.navy,
  },
  pathContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  pathLine: {
    position: 'absolute',
    top: 24,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: Colors.border,
  },
  pathNodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 12,
  },
  pathNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  pathText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
