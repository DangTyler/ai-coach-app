import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import { Audio } from "expo-av";
import { AndroidOutputFormat, AndroidAudioEncoder, IOSOutputFormat, IOSAudioQuality } from 'expo-av/build/Audio/RecordingConstants';
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useLocalSearchParams, Stack } from "expo-router";
import { Send, SlidersHorizontal, X, Mic, Volume2, Square, AudioLines, Zap } from "lucide-react-native";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Switch,
  ScrollView,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Alert,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useChats } from "@/contexts/ChatContext";
import { useCoaches } from "@/contexts/CoachContext";
import { defaultContextCards, ContextCard } from "@/mocks/chats";
import { onboardingStorage, UserContext } from "@/app/onboarding/storage";
import { voiceSettingsStorage } from "@/store/voiceSettings";

const { height: screenHeight } = Dimensions.get("window");

interface DisplayMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function ChatScreen() {
  const { id, initialPrompt, chatId } = useLocalSearchParams<{
    id: string;
    initialPrompt?: string;
    chatId?: string;
  }>();
  const insets = useSafeAreaInsets();

  const { getCoachById } = useCoaches();
  const coach = getCoachById(id || "");
  const { getOrCreateChat, addMessage, getMessages } = useChats();
  
  const [activeChatId, setActiveChatId] = useState<string | null>(chatId || null);
  const [inputText, setInputText] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [contextCards, setContextCards] = useState<ContextCard[]>(defaultContextCards);
  const [hasUsedInitialPrompt, setHasUsedInitialPrompt] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadUserContext = async () => {
      const context = await onboardingStorage.getUserContext();
      if (context) {
        setUserContext(context);
      }
    };
    loadUserContext();
  }, []);

  const systemPrompt = useMemo(() => {
    if (!coach) return "";
    
    const enabledCards = contextCards.filter(c => c.enabled && c.content.trim());
    let userContextSection = "";
    
    // Add stored user context from onboarding
    if (userContext?.name || userContext?.background || userContext?.goals) {
      userContextSection += "\n\nAbout the user:";
      if (userContext.name) {
        userContextSection += `\n- Name: ${userContext.name}`;
      }
      if (userContext.background) {
        userContextSection += `\n- Background: ${userContext.background}`;
      }
      if (userContext.goals) {
        userContextSection += `\n- Goals: ${userContext.goals}`;
      }
      if (userContext.experienceLevel) {
        userContextSection += `\n- Experience Level: ${userContext.experienceLevel}`;
      }
    }
    
    // Add context cards
    if (enabledCards.length > 0) {
      userContextSection += `\n\nAdditional context shared by the user:\n${enabledCards.map(c => `${c.title}: ${c.content}`).join('\n')}`;
    }
    
    if (userContextSection) {
      userContextSection += "\n\nUse this information to personalize your responses, but don't explicitly reference these details unless relevant.";
    }
    
    const basePrompt = coach.systemPrompt || `You are ${coach.name}. ${coach.tagline}.

Your core promise: ${coach.promise}

Your area of expertise: ${coach.category}

Personality & Approach:
- Speak naturally as yourself, not as an AI assistant
- Be warm, direct, and genuinely helpful
- Draw from your expertise to give practical, actionable advice
- Ask clarifying questions when needed
- Keep responses focused and conversational (2-4 paragraphs unless more detail is requested)
- Show personality - you have opinions and a unique perspective`;
    
    return `${basePrompt}${userContextSection}`;
  }, [coach, contextCards, userContext]);

  const { messages: agentMessages, sendMessage: sendAgentMessage, status, setMessages } = useRorkAgent({
    tools: {} as Record<string, never>,
  });

  const [isSystemInitialized, setIsSystemInitialized] = useState(false);
  const [lastSyncedMessageCount, setLastSyncedMessageCount] = useState(0);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [autoSend, setAutoSend] = useState(false);
  const [voiceConvoMode, setVoiceConvoMode] = useState(false);
  const [isVoiceConvoActive, setIsVoiceConvoActive] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const pendingAutoSendRef = useRef<string | null>(null);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const loadVoiceSettings = async () => {
      const settings = await voiceSettingsStorage.get();
      setAutoSend(settings.autoSend);
      setVoiceConvoMode(settings.voiceConversationMode);
    };
    loadVoiceSettings();
  }, []);

  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
        pulseAnim.setValue(1);
        pulseOpacity.setValue(0.6);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording, pulseAnim, pulseOpacity]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const displayMessages = useMemo((): DisplayMessage[] => {
    const msgs: DisplayMessage[] = [];
    
    agentMessages.forEach((m) => {
      if (m.role === "user") {
        const textPart = m.parts.find(p => p.type === "text");
        if (textPart && textPart.type === "text") {
          msgs.push({
            id: m.id,
            content: textPart.text,
            isUser: true,
            timestamp: new Date(),
          });
        }
      } else if (m.role === "assistant") {
        const textParts = m.parts.filter(p => p.type === "text");
        const content = textParts.map(p => p.type === "text" ? p.text : "").join("");
        if (content) {
          msgs.push({
            id: m.id,
            content,
            isUser: false,
            timestamp: new Date(),
            isStreaming: status === "streaming",
          });
        }
      }
    });
    
    return msgs;
  }, [agentMessages, status]);

  const openSheet = useCallback(() => {
    setShowContext(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, overlayAnim]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: screenHeight,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowContext(false));
  }, [slideAnim, overlayAnim]);

  useEffect(() => {
    if (!isSystemInitialized && systemPrompt && coach) {
      const initialMessages: {
        id: string;
        role: 'system' | 'user' | 'assistant';
        parts: { type: 'text'; text: string }[];
      }[] = [
        {
          id: 'system-init',
          role: 'system' as const,
          parts: [{ type: 'text' as const, text: systemPrompt }],
        },
      ];

      // Load existing messages if we have a chatId
      if (activeChatId) {
        const existingMessages = getMessages(activeChatId);
        existingMessages.forEach((msg) => {
          initialMessages.push({
            id: msg.id,
            role: msg.isUser ? 'user' as const : 'assistant' as const,
            parts: [{ type: 'text' as const, text: msg.content }],
          });
        });
        // Set synced count so we don't re-save these messages
        setLastSyncedMessageCount(existingMessages.length);
      }

      setMessages(initialMessages);
      setIsSystemInitialized(true);
    }
  }, [systemPrompt, coach, isSystemInitialized, setMessages, activeChatId, getMessages]);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !coach || isLoading) return;

      let currentChatId = activeChatId;
      if (!currentChatId) {
        currentChatId = getOrCreateChat(coach.id, coach.name, coach.avatar);
        setActiveChatId(currentChatId);
      }

      sendAgentMessage(text.trim());
      setInputText("");
    },
    [coach, activeChatId, getOrCreateChat, sendAgentMessage, isLoading]
  );

  useEffect(() => {
    if (initialPrompt && !hasUsedInitialPrompt) {
      setHasUsedInitialPrompt(true);
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, hasUsedInitialPrompt, handleSendMessage]);

  // Sync messages to ChatContext for persistence
  useEffect(() => {
    if (!activeChatId || status === "streaming" || status === "submitted") return;
    
    const newMessages = displayMessages.slice(lastSyncedMessageCount);
    if (newMessages.length === 0) return;
    
    newMessages.forEach((msg) => {
      addMessage(activeChatId, {
        id: msg.id,
        content: msg.content,
        isUser: msg.isUser,
        timestamp: msg.timestamp,
      });
    });
    
    setLastSyncedMessageCount(displayMessages.length);
  }, [activeChatId, displayMessages, lastSyncedMessageCount, status, addMessage]);

  const toggleCard = useCallback((cardId: string) => {
    setContextCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, enabled: !card.enabled } : card
      )
    );
  }, []);

  const updateCardContent = useCallback((cardId: string, content: string) => {
    setContextCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, content } : card))
    );
  }, []);

  const startRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        console.log('[Voice] Web recording started');
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant microphone access to use voice input.');
          return;
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: AndroidOutputFormat.MPEG_4,
            audioEncoder: AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: IOSOutputFormat.LINEARPCM,
            audioQuality: IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        });
        
        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
        console.log('[Voice] Native recording started');
      }
    } catch (error) {
      console.error('[Voice] Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, []);

  const handleTranscriptionResult = useCallback((text: string) => {
    console.log('[Voice] Transcription result:', text);
    if (!text) return;

    if (autoSend || isVoiceConvoActive) {
      pendingAutoSendRef.current = text;
    } else {
      setInputText(prev => prev + (prev ? ' ' : '') + text);
    }
  }, [autoSend, isVoiceConvoActive]);

  useEffect(() => {
    if (pendingAutoSendRef.current && !isLoading && !isTranscribing) {
      const text = pendingAutoSendRef.current;
      pendingAutoSendRef.current = null;
      handleSendMessage(text);
    }
  }, [isLoading, isTranscribing, handleSendMessage]);

  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (Platform.OS === 'web') {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder) {
          setIsTranscribing(false);
          return;
        }
        
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.stop();
        });
        
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current = null;
        console.log('[Voice] Web recording stopped, blob size:', audioBlob.size);
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Voice] STT API error:', response.status, errorText);
          throw new Error('Transcription failed');
        }
        
        const result = await response.json();
        handleTranscriptionResult(result.text || '');
      } else {
        const recording = recordingRef.current;
        if (!recording) {
          setIsTranscribing(false);
          return;
        }
        
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        
        const uri = recording.getURI();
        recordingRef.current = null;
        
        if (!uri) {
          setIsTranscribing(false);
          return;
        }
        
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        console.log('[Voice] Native recording stopped, uri:', uri, 'type:', fileType);
        
        const formData = new FormData();
        formData.append('audio', {
          uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as unknown as Blob);
        
        const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Voice] STT API error:', response.status, errorText);
          throw new Error('Transcription failed');
        }
        
        const result = await response.json();
        handleTranscriptionResult(result.text || '');
      }
      
      setIsTranscribing(false);
    } catch (error) {
      console.error('[Voice] Failed to stop recording:', error);
      setIsTranscribing(false);
      if (isVoiceConvoActive) {
        setIsVoiceConvoActive(false);
      }
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    }
  }, [handleTranscriptionResult, isVoiceConvoActive]);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const toggleVoiceConvoMode = useCallback(() => {
    if (isVoiceConvoActive) {
      setIsVoiceConvoActive(false);
      if (isRecording) {
        stopRecording();
      }
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      setIsVoiceConvoActive(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      startRecording();
    }
  }, [isVoiceConvoActive, isRecording, isSpeaking, stopRecording, startRecording]);

  const speakMessage = useCallback(async (messageId: string, text: string, isVoiceConvo?: boolean) => {
    if (isSpeaking && speakingMessageId === messageId) {
      Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }
    
    if (isSpeaking) {
      Speech.stop();
    }
    
    setIsSpeaking(true);
    setSpeakingMessageId(messageId);
    
    Speech.speak(text, {
      onDone: () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        if (isVoiceConvo) {
          setTimeout(() => {
            startRecording();
          }, 400);
        }
      },
      onStopped: () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
    });
  }, [isSpeaking, speakingMessageId, startRecording]);

  useEffect(() => {
    if (!isVoiceConvoActive) return;
    if (isLoading || isTranscribing || isRecording || isSpeaking) return;
    
    const lastMsg = displayMessages[displayMessages.length - 1];
    if (lastMsg && !lastMsg.isUser && !lastMsg.isStreaming) {
      speakMessage(lastMsg.id, lastMsg.content, true);
    }
  }, [isVoiceConvoActive, isLoading, isTranscribing, isRecording, isSpeaking, displayMessages, speakMessage]);

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isSpeaking]);

  const toggleAutoSend = useCallback(async () => {
    const newVal = !autoSend;
    setAutoSend(newVal);
    await voiceSettingsStorage.save({ autoSend: newVal });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [autoSend]);

  const toggleVoiceConvoSetting = useCallback(async () => {
    const newVal = !voiceConvoMode;
    setVoiceConvoMode(newVal);
    await voiceSettingsStorage.save({ voiceConversationMode: newVal });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [voiceConvoMode]);

  if (!coach) {
    return (
      <View style={styles.container}>
        <Text>Coach not found</Text>
      </View>
    );
  }

  const renderMessage = ({ item }: { item: DisplayMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {!item.isUser && (
        <Image source={{ uri: coach.avatar }} style={styles.messageAvatar} />
      )}
      <View style={[styles.messageBubbleRow, item.isUser && styles.userBubbleRow]}>
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isUser ? styles.userText : styles.aiText,
            ]}
          >
            {item.content}
          </Text>
        </View>
        {!item.isUser && !item.isStreaming && (
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => speakMessage(item.id, item.content)}
            activeOpacity={0.7}
          >
            {isSpeaking && speakingMessageId === item.id ? (
              <Square color={coach.color} size={16} fill={coach.color} />
            ) : (
              <Volume2 color={Colors.textSecondary} size={16} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isLoading || displayMessages.length === 0 || displayMessages[displayMessages.length - 1]?.isUser === false) {
      return null;
    }
    return (
      <View style={[styles.messageContainer, styles.aiMessage]}>
        <Image source={{ uri: coach.avatar }} style={styles.messageAvatar} />
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <ActivityIndicator size="small" color={coach.color} />
          <Text style={styles.typingText}>Thinking...</Text>
        </View>
      </View>
    );
  };

  const enabledCount = contextCards.filter((c) => c.enabled).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: coach.name,
          headerRight: () => (
            <TouchableOpacity
              onPress={openSheet}
              style={styles.headerContextButton}
            >
              <SlidersHorizontal color={Colors.navy} size={20} />
              {enabledCount > 0 && (
                <View style={styles.contextBadge}>
                  <Text style={styles.contextBadgeText}>{enabledCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {displayMessages.length === 0 ? (
        <View style={styles.emptyState}>
          <Image source={{ uri: coach.avatar }} style={styles.emptyAvatar} />
          <Text style={styles.emptyTitle}>Chat with {coach.name}</Text>
          <Text style={styles.emptySubtitle}>
            Ask me anything about {coach.category.toLowerCase()}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={renderTypingIndicator}
        />
      )}

      {isVoiceConvoActive && (
        <View style={styles.voiceConvoOverlay}>
          <View style={styles.voiceConvoContent}>
            <View style={styles.voiceConvoIndicator}>
              {isRecording ? (
                <View style={styles.voiceConvoPulseContainer}>
                  <Animated.View
                    style={[
                      styles.voiceConvoPulseRing,
                      { backgroundColor: coach.color + '30', transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                    ]}
                  />
                  <View style={[styles.voiceConvoMicCircle, { backgroundColor: coach.color }]}> 
                    <AudioLines color={Colors.white} size={32} />
                  </View>
                </View>
              ) : isTranscribing ? (
                <View style={[styles.voiceConvoMicCircle, { backgroundColor: Colors.textSecondary }]}> 
                  <ActivityIndicator size="large" color={Colors.white} />
                </View>
              ) : isSpeaking ? (
                <View style={[styles.voiceConvoMicCircle, { backgroundColor: coach.color }]}> 
                  <Volume2 color={Colors.white} size={32} />
                </View>
              ) : isLoading ? (
                <View style={[styles.voiceConvoMicCircle, { backgroundColor: Colors.textMuted }]}> 
                  <ActivityIndicator size="large" color={Colors.white} />
                </View>
              ) : (
                <View style={[styles.voiceConvoMicCircle, { backgroundColor: Colors.border }]}> 
                  <Mic color={Colors.textSecondary} size={32} />
                </View>
              )}
            </View>
            <Text style={styles.voiceConvoStatus}>
              {isRecording ? `Listening... ${formatDuration(recordingDuration)}` : isTranscribing ? 'Processing...' : isSpeaking ? `${coach.name} is speaking...` : isLoading ? 'Thinking...' : 'Starting...'}
            </Text>
            <TouchableOpacity
              style={[styles.voiceConvoStopButton, { borderColor: coach.color }]}
              onPress={toggleVoiceConvoMode}
              activeOpacity={0.8}
            >
              <Square color={coach.color} size={16} fill={coach.color} />
              <Text style={[styles.voiceConvoStopText, { color: coach.color }]}>End Conversation</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        {isRecording && !isVoiceConvoActive && (
          <View style={styles.recordingBar}>
            <View style={styles.recordingBarLeft}>
              <Animated.View
                style={[
                  styles.recordingDot,
                  { backgroundColor: '#EF4444', transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                ]}
              />
              <View style={[styles.recordingDotInner, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
            </View>
            <Text style={styles.recordingHint}>Tap mic to stop</Text>
          </View>
        )}
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && !isVoiceConvoActive && styles.micButtonRecording,
            ]}
            onPress={handleMicPress}
            disabled={isTranscribing || isLoading || isVoiceConvoActive}
            activeOpacity={0.7}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={coach.color} />
            ) : isRecording ? (
              <Square color={Colors.white} size={18} fill={Colors.white} />
            ) : (
              <Mic color={Colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={isRecording ? "Recording..." : "Type your message..."}
            placeholderTextColor={isRecording ? coach.color : Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isRecording && !isVoiceConvoActive}
          />
          {voiceConvoMode && (
            <TouchableOpacity
              style={[
                styles.voiceConvoButton,
                isVoiceConvoActive && { backgroundColor: coach.color },
              ]}
              onPress={toggleVoiceConvoMode}
              disabled={isTranscribing}
              activeOpacity={0.7}
            >
              <Zap
                color={isVoiceConvoActive ? Colors.white : coach.color}
                size={18}
                fill={isVoiceConvoActive ? Colors.white : 'none'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() && !isLoading && { backgroundColor: coach.color },
            ]}
            onPress={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading || isRecording}
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

      {showContext && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Chat Context</Text>
                <TouchableOpacity onPress={closeSheet}>
                  <X color={Colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetSubtitle}>
                Enable cards to personalize this conversation
              </Text>
            </View>
            <ScrollView
              style={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.voiceSettingsSection}>
                <Text style={styles.voiceSettingsTitle}>Voice Settings</Text>
                <View style={styles.voiceSettingRow}>
                  <View style={styles.voiceSettingInfo}>
                    <Send color={coach.color} size={16} />
                    <Text style={styles.voiceSettingLabel}>Auto-send after recording</Text>
                  </View>
                  <Switch
                    value={autoSend}
                    onValueChange={toggleAutoSend}
                    trackColor={{ false: Colors.border, true: coach.color + '60' }}
                    thumbColor={autoSend ? coach.color : Colors.white}
                  />
                </View>
                <View style={styles.voiceSettingRow}>
                  <View style={styles.voiceSettingInfo}>
                    <Zap color={coach.color} size={16} />
                    <Text style={styles.voiceSettingLabel}>Voice conversation mode</Text>
                  </View>
                  <Switch
                    value={voiceConvoMode}
                    onValueChange={toggleVoiceConvoSetting}
                    trackColor={{ false: Colors.border, true: coach.color + '60' }}
                    thumbColor={voiceConvoMode ? coach.color : Colors.white}
                  />
                </View>
                {voiceConvoMode && (
                  <Text style={styles.voiceSettingHint}>
                    Tap the bolt icon to start a hands-free voice loop
                  </Text>
                )}
              </View>
              <Text style={styles.voiceSettingsTitle}>Context Cards</Text>
              {contextCards.map((card) => (
                <View key={card.id} style={styles.contextCard}>
                  <View style={styles.contextCardHeader}>
                    <Text style={styles.contextCardTitle}>{card.title}</Text>
                    <Switch
                      value={card.enabled}
                      onValueChange={() => toggleCard(card.id)}
                      trackColor={{
                        false: Colors.border,
                        true: coach.color + '60',
                      }}
                      thumbColor={card.enabled ? coach.color : Colors.white}
                    />
                  </View>
                  <TextInput
                    style={[
                      styles.contextCardInput,
                      !card.enabled && styles.contextCardInputDisabled,
                    ]}
                    value={card.content}
                    onChangeText={(text) => updateCardContent(card.id, text)}
                    multiline
                    editable={card.enabled}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  contextBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  contextBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.navy,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.navy,
    borderBottomRightRadius: 6,
  },
  userBubbleRow: {
    maxWidth: "85%",
  },
  aiBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.borderLight,
  },
  micButtonRecording: {
    backgroundColor: "#EF4444",
  },
  voiceConvoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.borderLight,
    marginRight: 4,
  },
  recordingBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  recordingBarLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute" as const,
  },
  recordingDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#EF4444",
    marginLeft: 12,
  },
  recordingHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  voiceConvoOverlay: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    bottom: 120,
    alignItems: "center" as const,
    zIndex: 50,
  },
  voiceConvoContent: {
    alignItems: "center" as const,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 32,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginHorizontal: 24,
    width: 280,
  },
  voiceConvoIndicator: {
    marginBottom: 16,
  },
  voiceConvoPulseContainer: {
    width: 80,
    height: 80,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  voiceConvoPulseRing: {
    position: "absolute" as const,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  voiceConvoMicCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  voiceConvoStatus: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.navy,
    textAlign: "center" as const,
    marginBottom: 20,
  },
  voiceConvoStopButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  voiceConvoStopText: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  voiceSettingsSection: {
    marginBottom: 20,
  },
  voiceSettingsTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  voiceSettingRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 10,
  },
  voiceSettingInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    marginRight: 12,
  },
  voiceSettingLabel: {
    fontSize: 15,
    color: Colors.navy,
    fontWeight: "500" as const,
    marginLeft: 10,
  },
  voiceSettingHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    marginLeft: 26,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.borderLight,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.navy,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.7,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHeader: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.navy,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sheetContent: {
    padding: 24,
  },
  contextCard: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  contextCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contextCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.navy,
  },
  contextCardInput: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  contextCardInputDisabled: {
    backgroundColor: Colors.borderLight,
    color: Colors.textMuted,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  typingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  messageBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "80%",
    flexShrink: 1,
  },
  speakButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    backgroundColor: Colors.borderLight,
  },
});
