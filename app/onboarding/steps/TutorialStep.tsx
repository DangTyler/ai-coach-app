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
import { coaches } from '@/mocks/coaches';

const RECOMMENDED_COACH = coaches[0];

export default function TutorialStep() {
  const { nextStep, currentStep, totalSteps, data, updateData } = useOnboarding();
  const [showConfetti, setShowConfetti] = useState(false);
  const [inputText, setInputText] = useState('');
  const [hasReceivedResponse, setHasReceivedResponse] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const systemPrompt = `You are ${RECOMMENDED_COACH.name}, ${RECOMMENDED_COACH.tagline}. ${RECOMMENDED_COACH.promise}

The user is new to the app and this is their first conversation with an AI coach.
${data.name ? `Their name is ${data.name}.` : ''}
${data.helpTopics ? `They mentioned they want help with: ${data.helpTopics}` : ''}

Keep your response warm, encouraging, and brief (2-3 sentences max).
Make them feel excited about using the app.
End with something that makes them want to continue the conversation.`;

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
      setMessages([
        {
          id: 'system-init',
          role: 'system' as const,
          parts: [{ type: 'text' as const, text: systemPrompt }],
        },
      ]);
      setIsSystemInitialized(true);
    }
  }, [systemPrompt, isSystemInitialized, setMessages]);

  useEffect(() => {
    if (status === 'ready' && agentMessages.length > 1 && !hasReceivedResponse) {
      const lastMessage = agentMessages[agentMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        setHasReceivedResponse(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
        
        updateData({ firstChatComplete: true });
        
        onboardingStorage.saveUserContext({
          name: data.name || '',
          helpTopics: data.helpTopics || '',
        });
        
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [status, agentMessages, hasReceivedResponse, data.name, data.helpTopics, updateData]);

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

  const suggestedPrompts = [
    `Hi! I'd love help with ${data.helpTopics || 'my goals'}`,
    "What can you help me with?",
    "I'm excited to get started!",
  ];

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
            <Image source={{ uri: RECOMMENDED_COACH.avatar }} style={styles.coachAvatar} />
            <View style={styles.coachDetails}>
              <Text style={styles.coachName}>{RECOMMENDED_COACH.name}</Text>
              <Text style={styles.coachTagline}>{RECOMMENDED_COACH.tagline}</Text>
            </View>
          </View>
          <Text style={styles.title}>Try it out!</Text>
          <Text style={styles.subtitle}>
            Send a message and experience your first coaching session
          </Text>
        </View>

        <View style={styles.chatContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {displayMessages.length === 0 && (
              <View style={styles.emptyChat}>
                <Sparkles color={Colors.accent} size={32} />
                <Text style={styles.emptyChatText}>
                  Say hi to {RECOMMENDED_COACH.name}!
                </Text>
              </View>
            )}
            
            {displayMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.isUser ? styles.userBubble : styles.aiBubble,
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
              <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={RECOMMENDED_COACH.color} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {displayMessages.length === 0 && !isLoading && (
            <View style={styles.suggestionsContainer}>
              {suggestedPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setInputText(prompt);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={300}
              editable={!hasReceivedResponse}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() && !isLoading && { backgroundColor: RECOMMENDED_COACH.color },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading || hasReceivedResponse}
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
        </View>

        {hasReceivedResponse && (
          <Animated.View style={styles.successContainer}>
            <Text style={styles.successText}>Amazing! You just had your first AI coaching moment ✨</Text>
            <TouchableOpacity
              style={styles.continueButton}
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
    marginBottom: 16,
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
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
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
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
    backgroundColor: Colors.cardAlt,
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
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500',
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
  },
  successText: {
    fontSize: 16,
    color: Colors.navy,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: Colors.navy,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    shadowColor: Colors.navy,
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
