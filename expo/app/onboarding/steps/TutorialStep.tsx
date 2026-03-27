import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Animated, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import { useOnboarding } from '../context';
import { onboardingStorage } from '../storage';
import ProgressBar from '@/components/onboarding/ProgressBar';
import ConfettiEffect from '@/components/onboarding/ConfettiEffect';
import Colors from '@/constants/colors';

const CONTEXT_QUESTIONS = [
  { key: 'background', question: "What's your current situation or background in this area?" },
  { key: 'goals', question: "What are you hoping to achieve?" },
  { key: 'experienceLevel', question: "How would you describe your experience level?" },
];

export default function TutorialStep() {
  const { nextStep, currentStep, totalSteps, data, updateData } = useOnboarding();
  const [showConfetti, setShowConfetti] = useState(false);
  const [inputText, setInputText] = useState('');
  const [contextStep, setContextStep] = useState(0);
  const [gatheredContext, setGatheredContext] = useState<Record<string, string>>({});
  const [isContextComplete, setIsContextComplete] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const createdCoach = data.createdCoach;
  const coachName = createdCoach?.name || 'Your Coach';
  const coachAvatar = createdCoach?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face';
  const coachColor = createdCoach?.color || Colors.accent;
  const coachTopic = createdCoach?.topic || 'general';
  const coachPersonality = createdCoach?.personality || 'Supportive & Warm';

  const systemPrompt = `You are ${coachName}, a ${coachPersonality.toLowerCase()} AI coach specializing in ${coachTopic}.
${data.name ? `The user's name is ${data.name}.` : ''}

Your job is to have a brief, warm introductory conversation to understand the user better.
This is their first time using the app.

Current context gathering step: ${contextStep + 1} of 3
${contextStep === 0 ? "Ask about their current situation/background in " + coachTopic + " in a conversational way." : ""}
${contextStep === 1 ? "Based on what they shared, ask about their goals - what they hope to achieve." : ""}
${contextStep === 2 ? "Ask about their experience level to personalize future advice." : ""}

Keep responses warm, brief (2-3 sentences), and conversational.
After they answer, acknowledge what they shared and naturally lead to the next topic.
${Object.keys(gatheredContext).length > 0 ? `What you know so far: ${JSON.stringify(gatheredContext)}` : ''}`;

  const { messages: agentMessages, sendMessage: sendAgentMessage, status, setMessages } = useRorkAgent({
    tools: {} as Record<string, never>,
  });

  const [isSystemInitialized, setIsSystemInitialized] = useState(false);
  const isLoading = status === "streaming" || status === "submitted";

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

  useEffect(() => {
    if (!isSystemInitialized && systemPrompt) {
      const greeting = `Hi${data.name ? ` ${data.name}` : ''}! I'm ${coachName}, and I'm excited to be your ${coachTopic.toLowerCase()} coach. Before we dive in, I'd love to learn a bit about you so I can give you the best guidance. ${CONTEXT_QUESTIONS[0].question}`;
      
      setMessages([
        {
          id: 'system-init',
          role: 'system' as const,
          parts: [{ type: 'text' as const, text: systemPrompt }],
        },
        {
          id: 'greeting',
          role: 'assistant' as const,
          parts: [{ type: 'text' as const, text: greeting }],
        },
      ]);
      setIsSystemInitialized(true);
    }
  }, [systemPrompt, isSystemInitialized, setMessages, data.name, coachName, coachTopic]);

  useEffect(() => {
    if (status === 'ready' && agentMessages.length > 2) {
      const userMessages = agentMessages.filter(m => m.role === 'user');
      const newContextStep = Math.min(userMessages.length, 3);
      
      if (newContextStep > contextStep) {
        const lastUserMessage = userMessages[userMessages.length - 1];
        const textPart = lastUserMessage.parts.find(p => p.type === 'text');
        const userResponse = textPart?.type === 'text' ? textPart.text : '';
        
        const contextKey = CONTEXT_QUESTIONS[contextStep]?.key;
        if (contextKey && userResponse) {
          setGatheredContext(prev => ({ ...prev, [contextKey]: userResponse }));
        }
        
        setContextStep(newContextStep);
        
        if (newContextStep >= 3 && !isContextComplete) {
          setIsContextComplete(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowConfetti(true);
          
          const finalContext = {
            ...gatheredContext,
            [contextKey]: userResponse,
          };
          
          onboardingStorage.saveUserContext({
            name: data.name || '',
            background: finalContext.background,
            goals: finalContext.goals,
            experienceLevel: finalContext.experienceLevel,
          });
          
          updateData({ firstChatComplete: true });
          
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    }
  }, [status, agentMessages, contextStep, isContextComplete, gatheredContext, data.name, updateData]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isLoading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendAgentMessage(inputText.trim());
    setInputText('');
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, isLoading, sendAgentMessage]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nextStep();
  };

  const displayMessages = agentMessages
    .filter(m => m.role !== 'system')
    .map(m => {
      const textPart = m.parts.find(p => p.type === 'text');
      return {
        id: m.id,
        content: textPart?.type === 'text' ? textPart.text : '',
        isUser: m.role === 'user',
      };
    })
    .filter(m => m.content);

  const progressDots = [0, 1, 2].map(i => i < contextStep);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <View style={styles.header}>
          <View style={styles.coachInfo}>
            <Image source={{ uri: coachAvatar }} style={[styles.coachAvatar, { borderColor: coachColor }]} />
            <View style={styles.coachDetails}>
              <Text style={styles.coachName}>{coachName}</Text>
              <Text style={styles.coachTagline}>{coachTopic} Coach</Text>
            </View>
          </View>
          
          <View style={styles.contextProgress}>
            <Text style={styles.contextLabel}>Getting to know you</Text>
            <View style={styles.progressDots}>
              {progressDots.map((filled, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    filled && { backgroundColor: coachColor },
                  ]} 
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.chatContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {displayMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.isUser ? styles.userBubble : [styles.aiBubble, { backgroundColor: coachColor + '15' }],
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.isUser ? styles.userText : styles.aiText,
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))}
            
            {isLoading && (
              <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble, { backgroundColor: coachColor + '15' }]}>
                <ActivityIndicator size="small" color={coachColor} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {!isContextComplete && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your response..."
                placeholderTextColor={Colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim() && !isLoading && { backgroundColor: coachColor },
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.textMuted} />
                ) : (
                  <Send
                    color={inputText.trim() ? Colors.white : Colors.textMuted}
                    size={20}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isContextComplete && (
          <Animated.View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Sparkles color={coachColor} size={24} />
            </View>
            <Text style={styles.successText}>
              Great! {coachName} now knows you better and will personalize your experience.
            </Text>
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: coachColor }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
      
      <ConfettiEffect 
        trigger={showConfetti} 
        intensity="large"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coachAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 3,
  },
  coachDetails: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  coachTagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contextProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
  },
  contextLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: Colors.navy,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  aiText: {
    color: Colors.text,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 80,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardAlt,
    borderRadius: 20,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
  },
  successContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: Colors.navy,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  continueButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
