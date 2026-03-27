import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';
import CheckmarkAnimation from '@/components/onboarding/CheckmarkAnimation';
import Colors from '@/constants/colors';

export default function ProfileStep() {
  const { nextStep, currentStep, totalSteps, updateData, triggerConfetti } = useOnboarding();
  
  const [name, setName] = useState('');
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, [fadeAnim, slideAnim]);

  const handleNameChange = (text: string) => {
    setName(text);
  };

  const handleNameBlur = () => {
    if (name.trim().length > 0 && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      setShowCheck(true);
      triggerConfetti('small');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => {
        setShowCheck(false);
      }, 2500);
    }
  };

  const handleContinue = () => {
    if (name.trim()) {
      updateData({ name: name.trim() });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      nextStep();
    }
  };

  const canContinue = name.trim().length > 0;

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>What&apos;s your name?</Text>
        <Text style={styles.subtitle}>Your coach will use this to personalize your experience</Text>

        <View style={styles.inputContainer}>
          <User color={Colors.textMuted} size={24} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={handleNameChange}
            onBlur={handleNameBlur}
            autoCapitalize="words"
            autoFocus
          />
          <View style={styles.checkContainer}>
            <CheckmarkAnimation 
              trigger={showCheck} 
              size={28}
            />
          </View>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, !canContinue && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!canContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.navy,
    fontWeight: '500',
  },
  checkContainer: {
    position: 'absolute',
    right: 20,
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
  buttonDisabled: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
