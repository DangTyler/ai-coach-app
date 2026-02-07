import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, ScrollView, Image } from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';
import Colors from '@/constants/colors';
import { CreatedCoach } from '../storage';

const COACH_TOPICS = [
  { id: 'career', label: 'Career & Work', icon: '💼', color: '#6366F1' },
  { id: 'wellness', label: 'Wellness & Health', icon: '🧘', color: '#10B981' },
  { id: 'productivity', label: 'Productivity', icon: '⚡', color: '#F59E0B' },
  { id: 'finance', label: 'Finance & Money', icon: '💰', color: '#8B5CF6' },
  { id: 'relationships', label: 'Relationships', icon: '💬', color: '#EC4899' },
  { id: 'creativity', label: 'Creativity', icon: '🎨', color: '#F97316' },
] as const;

const PERSONALITY_STYLES = [
  { id: 'supportive', label: 'Supportive & Warm', description: 'Encouraging and empathetic', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
  { id: 'direct', label: 'Direct & Honest', description: 'Straightforward feedback', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
  { id: 'analytical', label: 'Analytical & Strategic', description: 'Data-driven insights', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
  { id: 'motivational', label: 'Motivational & Energetic', description: 'High energy encouragement', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
] as const;

type TopicId = typeof COACH_TOPICS[number]['id'];
type PersonalityId = typeof PERSONALITY_STYLES[number]['id'];

export default function CoachCreationStep() {
  const { nextStep, currentStep, totalSteps, updateData, triggerConfetti } = useOnboarding();
  
  const [step, setStep] = useState<'topic' | 'personality' | 'name'>('topic');
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityId | null>(null);
  const [coachName, setCoachName] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();
  }, [step, fadeAnim, slideAnim]);

  const handleTopicSelect = (topicId: TopicId) => {
    setSelectedTopic(topicId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePersonalitySelect = (personalityId: PersonalityId) => {
    setSelectedPersonality(personalityId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 'topic' && selectedTopic) {
      setStep('personality');
    } else if (step === 'personality' && selectedPersonality) {
      const suggestedName = getSuggestedName(selectedPersonality, selectedTopic);
      setCoachName(suggestedName);
      setStep('name');
    }
  };

  const getSuggestedName = (personality: PersonalityId | null, topic: TopicId | null): string => {
    const names: Record<string, string[]> = {
      supportive: ['Alex', 'Sam', 'Jordan', 'Riley'],
      direct: ['Morgan', 'Blake', 'Casey', 'Quinn'],
      analytical: ['Taylor', 'Avery', 'Jamie', 'Drew'],
      motivational: ['Sky', 'Phoenix', 'River', 'Sage'],
    };
    const nameList = personality ? names[personality] : names.supportive;
    return nameList[Math.floor(Math.random() * nameList.length)];
  };

  const handleCreateCoach = () => {
    if (!selectedTopic || !selectedPersonality || !coachName.trim()) return;

    const topic = COACH_TOPICS.find(t => t.id === selectedTopic)!;
    const personality = PERSONALITY_STYLES.find(p => p.id === selectedPersonality)!;

    const createdCoach: CreatedCoach = {
      id: `custom-${Date.now()}`,
      name: coachName.trim(),
      topic: topic.label,
      personality: personality.label,
      avatar: personality.avatar,
      color: topic.color,
    };

    updateData({ createdCoach });
    triggerConfetti('medium');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setTimeout(() => {
      nextStep();
    }, 500);
  };

  const renderTopicSelection = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.headerIcon}>
        <Sparkles color={Colors.accent} size={32} />
      </View>
      <Text style={styles.title}>Create Your First Coach</Text>
      <Text style={styles.subtitle}>What area would you like help with?</Text>

      <View style={styles.optionsGrid}>
        {COACH_TOPICS.map((topic) => {
          const isSelected = selectedTopic === topic.id;
          return (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicCard,
                isSelected && { borderColor: topic.color, backgroundColor: topic.color + '15' },
              ]}
              onPress={() => handleTopicSelect(topic.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <Text style={[styles.topicLabel, isSelected && { color: topic.color }]}>
                {topic.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderPersonalitySelection = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.title}>Choose a Style</Text>
      <Text style={styles.subtitle}>How would you like your coach to communicate?</Text>

      <View style={styles.personalityList}>
        {PERSONALITY_STYLES.map((personality) => {
          const isSelected = selectedPersonality === personality.id;
          const topic = COACH_TOPICS.find(t => t.id === selectedTopic);
          return (
            <TouchableOpacity
              key={personality.id}
              style={[
                styles.personalityCard,
                isSelected && { borderColor: topic?.color || Colors.accent, backgroundColor: (topic?.color || Colors.accent) + '10' },
              ]}
              onPress={() => handlePersonalitySelect(personality.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: personality.avatar }} style={styles.personalityAvatar} />
              <View style={styles.personalityInfo}>
                <Text style={[styles.personalityLabel, isSelected && { color: topic?.color || Colors.accent }]}>
                  {personality.label}
                </Text>
                <Text style={styles.personalityDescription}>{personality.description}</Text>
              </View>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: topic?.color || Colors.accent }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderNameInput = () => {
    const topic = COACH_TOPICS.find(t => t.id === selectedTopic);
    const personality = PERSONALITY_STYLES.find(p => p.id === selectedPersonality);
    
    return (
      <Animated.View
        style={[
          styles.stepContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Name Your Coach</Text>
        <Text style={styles.subtitle}>Give your {topic?.label.toLowerCase()} coach a name</Text>

        <View style={styles.coachPreview}>
          <Image source={{ uri: personality?.avatar }} style={styles.previewAvatar} />
          <View style={[styles.previewBadge, { backgroundColor: topic?.color }]}>
            <Text style={styles.previewBadgeText}>{topic?.icon}</Text>
          </View>
        </View>

        <TextInput
          style={[styles.nameInput, { borderColor: topic?.color || Colors.accent }]}
          placeholder="Enter coach name"
          placeholderTextColor={Colors.textMuted}
          value={coachName}
          onChangeText={setCoachName}
          autoCapitalize="words"
          autoFocus
        />

        <Text style={styles.previewText}>
          {coachName || 'Your Coach'} • {personality?.label}
        </Text>
      </Animated.View>
    );
  };

  const canContinue = 
    (step === 'topic' && selectedTopic) ||
    (step === 'personality' && selectedPersonality) ||
    (step === 'name' && coachName.trim().length > 0);

  const topic = COACH_TOPICS.find(t => t.id === selectedTopic);

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'topic' && renderTopicSelection()}
        {step === 'personality' && renderPersonalitySelection()}
        {step === 'name' && renderNameInput()}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button, 
          !canContinue && styles.buttonDisabled,
          canContinue && topic && { backgroundColor: topic.color },
        ]}
        onPress={step === 'name' ? handleCreateCoach : handleNextStep}
        disabled={!canContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {step === 'name' ? 'Create Coach' : 'Continue'}
        </Text>
        {step !== 'name' && <ChevronRight color={Colors.white} size={20} />}
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
  stepContent: {
    flex: 1,
    padding: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
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
    lineHeight: 22,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  topicIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    textAlign: 'center',
  },
  personalityList: {
    gap: 12,
  },
  personalityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  personalityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  personalityInfo: {
    flex: 1,
  },
  personalityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 2,
  },
  personalityDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  coachPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  previewBadgeText: {
    fontSize: 18,
  },
  nameInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.navy,
    textAlign: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.navy,
    margin: 24,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
