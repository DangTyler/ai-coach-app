import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowRight, Sparkles, Pencil, MessageSquare, Clock } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";

import Colors from "@/constants/colors";
import { useCoaches } from "@/contexts/CoachContext";
import { useChatStore, SavedChat } from "@/store/chatStore";

const { width } = Dimensions.get("window");

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}

export default function CoachDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCoachById } = useCoaches();
  const { getChatsForCoach, addChat } = useChatStore();

  const coach = getCoachById(id || "");
  const existingChats = getChatsForCoach(id || "");
  const hasExistingChats = existingChats.length > 0;

  if (!coach) {
    return (
      <View style={styles.container}>
        <Text>Coach not found</Text>
      </View>
    );
  }

  const handleStartNewChat = () => {
    const chatId = addChat(coach.id);
    router.push({
      pathname: '/chat/[id]',
      params: { id: coach.id, chatId },
    });
  };

  const handleContinueChat = (chatId: string) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: coach.id, chatId },
    });
  };

  const handleEditCoach = () => {
    router.push({
      pathname: '/coach/edit',
      params: { id: coach.id },
    });
  };

  const handlePromptPress = (prompt: string) => {
    const chatId = addChat(coach.id);
    router.push({
      pathname: '/chat/[id]',
      params: { id: coach.id, chatId, initialPrompt: prompt },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: coach.name,
          headerRight: () =>
            coach.isCustom ? (
              <TouchableOpacity onPress={handleEditCoach} style={{ padding: 8 }}>
                <Pencil color={Colors.navy} size={20} />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.heroSection, { backgroundColor: coach.color + '10' }]}>
          <View style={[styles.avatarRing, { borderColor: coach.color + '30' }]}>
            <Image source={{ uri: coach.avatar }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{coach.name}</Text>
          <Text style={styles.tagline}>{coach.tagline}</Text>
          <View style={[styles.categoryPill, { backgroundColor: coach.color + '20' }]}>
            <Text style={[styles.categoryText, { color: coach.color }]}>
              {coach.category}
            </Text>
          </View>
        </View>

        <View style={styles.promiseSection}>
          <View style={styles.sectionHeader}>
            <Sparkles color={coach.color} size={20} />
            <Text style={styles.sectionTitle}>My Promise</Text>
          </View>
          <Text style={styles.promiseText}>{coach.promise}</Text>
        </View>

        {hasExistingChats && (
          <View style={styles.chatsSection}>
            <Text style={styles.chatsSectionTitle}>Previous Conversations</Text>
            {existingChats.map((chat: SavedChat) => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatCard}
                onPress={() => handleContinueChat(chat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.chatCardContent}>
                  <Text style={styles.chatCardMessage} numberOfLines={1}>
                    {chat.lastMessage || "New conversation"}
                  </Text>
                  <View style={styles.chatCardMeta}>
                    <View style={styles.chatCardMetaItem}>
                      <MessageSquare color={Colors.textMuted} size={12} />
                      <Text style={styles.chatCardMetaText}>
                        {chat.messages.length} messages
                      </Text>
                    </View>
                    <View style={styles.chatCardMetaItem}>
                      <Clock color={Colors.textMuted} size={12} />
                      <Text style={styles.chatCardMetaText}>
                        {formatTimestamp(chat.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
                <ArrowRight color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.promptsSection}>
          <Text style={styles.promptsSectionTitle}>Try asking me</Text>
          {coach.prompts.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptCard}
              onPress={() => handlePromptPress(prompt)}
              activeOpacity={0.7}
            >
              <Text style={styles.promptText}>{prompt}</Text>
              <ArrowRight color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: coach.color }]}
          onPress={handleStartNewChat}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>
            {hasExistingChats ? "Start New Chat" : "Start Chat"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 64,
    borderWidth: 3,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 16,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  categoryPill: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  promiseSection: {
    marginTop: 24,
    marginHorizontal: 24,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
  },
  promiseText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 12,
    lineHeight: 24,
  },
  chatsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  chatsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 12,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  chatCardContent: {
    flex: 1,
    marginRight: 12,
  },
  chatCardMessage: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 6,
  },
  chatCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  chatCardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatCardMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  promptsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  promptsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 12,
  },
  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginRight: 12,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  startButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
});
