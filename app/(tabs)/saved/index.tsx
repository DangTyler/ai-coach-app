import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import { MessageSquare, Clock, ChevronRight, Trash2 } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  Animated,
} from "react-native";
import { Swipeable, TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useChats } from "@/contexts/ChatContext";
import { SavedChat } from "@/store/chatStore";

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

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedChats, deleteChat } = useChats();

  const handleChatPress = (chat: SavedChat) => {
    router.push(`/(library)/chat/${chat.coachId}?chatId=${chat.id}` as any);
  };

  const handleDeleteChat = (chat: SavedChat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete this conversation with ${chat.coachName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteChat(chat.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const renderRightActions = (
    chat: SavedChat,
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          { transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteChat(chat)}
        >
          <Trash2 color={Colors.white} size={24} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderChatItem = ({ item }: { item: SavedChat }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(item, progress, dragX)}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
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
            {item.lastMessage || "New conversation"}
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
    </Swipeable>
  );

  const chatsWithMessages = savedChats.filter(c => c.messages.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Chats</Text>
        <Text style={styles.subtitle}>
          {chatsWithMessages.length} conversation{chatsWithMessages.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {chatsWithMessages.length === 0 ? (
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
          data={chatsWithMessages}
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
  deleteAction: {
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "flex-end",
    borderRadius: 20,
    marginBottom: 12,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: "100%",
    paddingHorizontal: 16,
  },
  deleteText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
});
