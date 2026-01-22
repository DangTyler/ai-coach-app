import { useRouter } from "expo-router";
import { MessageSquare, Clock, ChevronRight } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { savedChats, SavedChat } from "@/mocks/chats";

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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
    return date.toLocaleDateString();
  }
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleChatPress = (chat: SavedChat) => {
    router.push(`/chat/${chat.coachId}?chatId=${chat.id}`);
  };

  const renderChatItem = ({ item }: { item: SavedChat }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.coachAvatar }} style={styles.avatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.coachName}>{item.coachName}</Text>
          <View style={styles.timeContainer}>
            <Clock color={Colors.textMuted} size={12} />
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage}
        </Text>
        <View style={styles.messageCount}>
          <MessageSquare color={Colors.textMuted} size={14} />
          <Text style={styles.messageCountText}>
            {item.messages.length} messages
          </Text>
        </View>
      </View>
      <ChevronRight color={Colors.textMuted} size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Chats</Text>
        <Text style={styles.subtitle}>
          {savedChats.length} conversation{savedChats.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {savedChats.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MessageSquare color={Colors.textMuted} size={48} />
          </View>
          <Text style={styles.emptyTitle}>No saved chats yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation with a coach to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.navy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  listContainer: {
    padding: 24,
    paddingTop: 16,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  coachName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.navy,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  messageCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  messageCountText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
    lineHeight: 22,
  },
});
