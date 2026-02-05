import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { useLocalSearchParams, Stack } from "expo-router";
import { Send, SlidersHorizontal, X, Mic, Volume2, Square } from "lucide-react-native";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useChats } from "@/contexts/ChatContext";
import { useCoaches } from "@/contexts/CoachContext";
import { defaultContextCards, ContextCard } from "@/mocks/chats";

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
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const systemPrompt = useMemo(() => {
    if (!coach) return "";
    
    const enabledCards = contextCards.filter(c => c.enabled && c.content.trim());
    const userContextSection = enabledCards.length > 0
      ? `\n\nThe user has shared the following about themselves:\n${enabledCards.map(c => `${c.title}: ${c.content}`).join('\n')}\n\nUse this information to personalize your responses, but don't explicitly reference these details unless relevant.`
      : "";
    
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
  }, [coach, contextCards]);

  const { messages: agentMessages, sendMessage: sendAgentMessage, status, setMessages } = useRorkAgent({
    tools: {},
  });

  const [isSystemInitialized, setIsSystemInitialized] = useState(false);
  const [lastSyncedMessageCount, setLastSyncedMessageCount] = useState(0);
  
  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isLoading = status === "streaming" || status === "submitted";

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

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
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
        console.log('Web recording started');
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
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        
        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
        console.log('Native recording started');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      let audioBlob: Blob;
      let fileName: string;
      let mimeType: string;
      
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
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        fileName = 'recording.webm';
        mimeType = 'audio/webm';
        mediaRecorderRef.current = null;
        console.log('Web recording stopped, blob size:', audioBlob.size);
      } else {
        const recording = recordingRef.current;
        if (!recording) {
          setIsTranscribing(false);
          return;
        }
        
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        
        const uri = recording.getURI();
        if (!uri) {
          setIsTranscribing(false);
          return;
        }
        
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        fileName = `recording.${fileType}`;
        mimeType = `audio/${fileType}`;
        
        // For native, we need to create form data differently
        const formData = new FormData();
        formData.append('audio', {
          uri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob);
        
        recordingRef.current = null;
        console.log('Native recording stopped, uri:', uri);
        
        // Send to STT API
        const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Transcription failed');
        }
        
        const result = await response.json();
        console.log('Transcription result:', result);
        
        if (result.text) {
          setInputText(prev => prev + (prev ? ' ' : '') + result.text);
        }
        
        setIsTranscribing(false);
        return;
      }
      
      // Web path - send blob to STT API
      const formData = new FormData();
      formData.append('audio', audioBlob, fileName);
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const result = await response.json();
      console.log('Transcription result:', result);
      
      if (result.text) {
        setInputText(prev => prev + (prev ? ' ' : '') + result.text);
      }
      
      setIsTranscribing(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsTranscribing(false);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    }
  }, []);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Text-to-speech functions
  const speakMessage = useCallback(async (messageId: string, text: string) => {
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
  }, [isSpeaking, speakingMessageId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [isSpeaking]);

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
      <View style={styles.messageBubbleRow}>
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

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonRecording,
            ]}
            onPress={handleMicPress}
            disabled={isTranscribing || isLoading}
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
            editable={!isRecording}
          />
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
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.navy,
    borderBottomRightRadius: 6,
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
