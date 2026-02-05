import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';

import CheckmarkAnimation from '@/components/onboarding/CheckmarkAnimation';
import Colors from '@/constants/colors';

const HELP_TOPICS = [
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'relationships', label: 'Relationships', icon: '💬' },
  { id: 'creativity', label: 'Creativity', icon: '🎨' },
] as const;

type TopicId = typeof HELP_TOPICS[number]['id'];

export default function ProfileStep() {
  const { nextStep, currentStep, totalSteps, updateData, triggerConfetti } = useOnboarding();
  
  const [name, setName] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([]);
  const [hasTriggeredNameConfetti, setHasTriggeredNameConfetti] = useState(false);
  const [hasTriggeredTopicConfetti, setHasTriggeredTopicConfetti] = useState(false);
  const [showNameCheck, setShowNameCheck] = useState(false);

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

  const handleTopicToggle = (topicId: TopicId) => {
    setSelectedTopics(prev => {
      const isSelected = prev.includes(topicId);
      const newTopics = isSelected 
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId];
      
      if (!isSelected && !hasTriggeredTopicConfetti) {
        setHasTriggeredTopicConfetti(true);
        triggerConfetti('small');
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const topicLabels = newTopics.map(t => 
        HELP_TOPICS.find(h => h.id === t)?.label
      ).filter(Boolean).join(', ');
      updateData({ helpTopics: topicLabels });
      
      return newTopics;
    });
  };

  const handleContinue = () => {
    if (name && selectedTopics.length > 0) {
      updateData({ name });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      nextStep();
    }
  };

  const canContinue = name.length > 0 && selectedTopics.length > 0;

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Let&apos;s get to know you</Text>
          <Text style={styles.subtitle}>Let&apos;s personalize your coaching</Text>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>What&apos;s your name?</Text>
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

          {/* Help Topics Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>What would you like help with?</Text>
            <Text style={styles.labelHint}>Select all that apply</Text>
            <View style={styles.topicsContainer}>
              {HELP_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicChip,
                      isSelected && styles.topicChipActive,
                    ]}
                    onPress={() => handleTopicToggle(topic.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.topicIcon}>{topic.icon}</Text>
                    <Text style={[
                      styles.topicLabel,
                      isSelected && styles.topicLabelActive,
                    ]}>
                      {topic.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  topicChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  topicIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  topicLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.navy,
  },
  topicLabelActive: {
    color: Colors.accent,
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
