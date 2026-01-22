import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowRight, Sparkles } from "lucide-react-native";
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
import { coaches } from "@/mocks/coaches";

const { width } = Dimensions.get("window");

export default function CoachDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const coach = coaches.find((c) => c.id === id);

  if (!coach) {
    return (
      <View style={styles.container}>
        <Text>Coach not found</Text>
      </View>
    );
  }

  const handleStartChat = () => {
    router.push(`/chat/${coach.id}`);
  };

  const handlePromptPress = (prompt: string) => {
    router.push({
      pathname: `/chat/${coach.id}`,
      params: { initialPrompt: prompt },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: coach.name }} />
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
          onPress={handleStartChat}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Start Chat</Text>
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
