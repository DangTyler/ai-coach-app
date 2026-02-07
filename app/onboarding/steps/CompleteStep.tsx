import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Rocket, MessageCircle, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';
import ConfettiEffect from '@/components/onboarding/ConfettiEffect';
import Colors from '@/constants/colors';

export default function CompleteStep() {
  const { currentStep, totalSteps, data, completeOnboarding } = useOnboarding();
  const router = useRouter();
  
  const [showConfetti, setShowConfetti] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const coachBounce = useRef(new Animated.Value(0)).current;

  const createdCoach = data.createdCoach;
  const coachColor = createdCoach?.color || Colors.accent;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 300);

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(coachBounce, {
          toValue: -8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(coachBounce, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

  }, [fadeAnim, slideAnim, coachBounce]);

  const handleStart = async () => {
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

    await completeOnboarding();

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
          <Rocket color={Colors.white} size={48} />
        </View>

        <Text style={styles.title}>You&apos;re Ready!</Text>
        <Text style={styles.subtitle}>
          {data.name ? `${data.name}, your` : 'Your'} personalized coaching journey begins now
        </Text>

        {createdCoach && (
          <Animated.View 
            style={[
              styles.coachCard,
              { transform: [{ translateY: coachBounce }] }
            ]}
          >
            <Image source={{ uri: createdCoach.avatar }} style={styles.coachAvatar} />
            <View style={[styles.coachBadge, { backgroundColor: coachColor }]}>
              <MessageCircle color={Colors.white} size={16} />
            </View>
            <Text style={styles.coachName}>{createdCoach.name}</Text>
            <Text style={styles.coachTopic}>{createdCoach.topic} Coach</Text>
            <View style={styles.readyBadge}>
              <Sparkles color={coachColor} size={14} />
              <Text style={[styles.readyText, { color: coachColor }]}>Ready to chat</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: coachColor + '20' }]}>
              <MessageCircle color={coachColor} size={20} />
            </View>
            <Text style={styles.featureText}>Chat anytime with {createdCoach?.name || 'your coach'}</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.success + '20' }]}>
              <Sparkles color={Colors.success} size={20} />
            </View>
            <Text style={styles.featureText}>Personalized advice based on your context</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: coachColor }]}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Start Chatting</Text>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
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
    marginBottom: 32,
    lineHeight: 22,
  },
  coachCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  coachAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  coachBadge: {
    position: 'absolute',
    top: 80,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  coachName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 4,
  },
  coachTopic: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  readyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  featuresList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.navy,
    fontWeight: '500',
  },
  button: {
    margin: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
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
