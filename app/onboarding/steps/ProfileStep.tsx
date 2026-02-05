import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';

import CheckmarkAnimation from '@/components/onboarding/CheckmarkAnimation';
import Colors from '@/constants/colors';

const GOALS = [
  { id: 'learn', label: 'Learn', icon: '📚', description: 'Master new skills' },
  { id: 'improve', label: 'Improve', icon: '📈', description: 'Enhance existing abilities' },
  { id: 'explore', icon: '🔍', label: 'Explore', description: 'Discover new possibilities' },
] as const;

type GoalId = typeof GOALS[number]['id'];

export default function ProfileStep() {
  const { nextStep, currentStep, totalSteps, updateData, triggerConfetti } = useOnboarding();
  
  const [name, setName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<GoalId | null>(null);
  const [hasTriggeredNameConfetti, setHasTriggeredNameConfetti] = useState(false);
  const [hasTriggeredGoalConfetti, setHasTriggeredGoalConfetti] = useState(false);
  const [showNameCheck, setShowNameCheck] = useState(false);
  const [showGoalCheck, setShowGoalCheck] = useState(false);

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
    if (name.trim().length > 0 && !hasTriggeredNameConfetti) {
      setHasTriggeredNameConfetti(true);
      setShowNameCheck(true);
      triggerConfetti('small');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => {
        setShowNameCheck(false);
      }, 2500);
    }
  };

  const handleGoalSelect = (goalId: GoalId) => {
    setSelectedGoal(goalId);
    setShowGoalCheck(true);
    if (!hasTriggeredGoalConfetti) {
      setHasTriggeredGoalConfetti(true);
      triggerConfetti('small');
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateData({ goal: goalId });

    setTimeout(() => {
      setShowGoalCheck(false);
    }, 2500);
  };

  const handleContinue = () => {
    if (name && selectedGoal) {
      updateData({ name });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      nextStep();
    }
  };

  const canContinue = name.length > 0 && selectedGoal !== null;

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
        <Text style={styles.title}>Let's get to know you</Text>
        <Text style={styles.subtitle}>Personalize your coaching experience</Text>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>What's your name?</Text>
          <View style={styles.inputContainer}>
            <User color={Colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={handleNameChange}
              onBlur={handleNameBlur}
              autoCapitalize="words"
            />
            <View style={styles.checkContainer}>
              <CheckmarkAnimation 
                trigger={showNameCheck} 
                size={28}
              />
            </View>
          </View>
        </View>

        {/* Goal Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>What's your goal?</Text>
          <View style={styles.goalsContainer}>
            {GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  selectedGoal === goal.id && styles.goalCardActive,
                ]}
                onPress={() => handleGoalSelect(goal.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalLabel,
                  selectedGoal === goal.id && styles.goalLabelActive,
                ]}>
                  {goal.label}
                </Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                {selectedGoal === goal.id && (
                  <View style={styles.goalCheckContainer}>
                    <CheckmarkAnimation 
                      trigger={showGoalCheck} 
                      size={24}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.navy,
  },
  checkContainer: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  goalsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  goalCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 4,
  },
  goalLabelActive: {
    color: Colors.accent,
  },
  goalDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  goalCheckContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
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
