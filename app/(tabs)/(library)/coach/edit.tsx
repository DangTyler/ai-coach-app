import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Check, Trash2, X } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import {
  useCoaches,
  avatarOptions,
  colorOptions,
  defaultCategories,
} from "@/contexts/CoachContext";

export default function CoachEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCoachById, addCoach, updateCoach, deleteCoach } = useCoaches();

  const isEditing = !!id;
  const existingCoach = id ? getCoachById(id) : undefined;

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState(defaultCategories[1]);
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const [color, setColor] = useState(colorOptions[0]);
  const [promise, setPromise] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [prompts, setPrompts] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    if (existingCoach) {
      setName(existingCoach.name);
      setTagline(existingCoach.tagline);
      setCategory(existingCoach.category);
      setAvatar(existingCoach.avatar);
      setColor(existingCoach.color);
      setPromise(existingCoach.promise);
      setSystemPrompt(existingCoach.systemPrompt || "");
      setPrompts(existingCoach.prompts.length >= 3 
        ? existingCoach.prompts.slice(0, 3) 
        : [...existingCoach.prompts, ...Array(3 - existingCoach.prompts.length).fill("")]);
    }
  }, [existingCoach]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a name for your coach");
      return;
    }
    if (!tagline.trim()) {
      Alert.alert("Required", "Please enter a tagline");
      return;
    }

    const coachData = {
      name: name.trim(),
      tagline: tagline.trim(),
      category,
      avatar,
      color,
      promise: promise.trim() || `I'm ${name}, here to help you with ${category.toLowerCase()}.`,
      systemPrompt: systemPrompt.trim(),
      prompts: prompts.filter(p => p.trim()),
    };

    if (isEditing && id) {
      updateCoach(id, coachData);
    } else {
      addCoach(coachData);
    }

    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Coach",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (id) {
              deleteCoach(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const updatePrompt = (index: number, value: string) => {
    const updated = [...prompts];
    updated[index] = value;
    setPrompts(updated);
  };

  const categories = defaultCategories.filter(c => c !== "All");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Coach" : "Create Coach",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X color={Colors.navy} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave}>
              <Check color={color} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.avatarRow}>
              {avatarOptions.map((uri) => (
                <TouchableOpacity
                  key={uri}
                  onPress={() => setAvatar(uri)}
                  style={[
                    styles.avatarOption,
                    avatar === uri && { borderColor: color, borderWidth: 3 },
                  ]}
                >
                  <Image source={{ uri }} style={styles.avatarImage} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.colorRow}>
            {colorOptions.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex the Mentor"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tagline *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Your Personal Growth Guide"
            placeholderTextColor={Colors.textMuted}
            value={tagline}
            onChangeText={setTagline}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    category === cat && { backgroundColor: color, borderColor: color },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promise (Bio)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what this coach helps with..."
            placeholderTextColor={Colors.textMuted}
            value={promise}
            onChangeText={setPromise}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Prompt</Text>
          <Text style={styles.sectionHint}>
            Custom instructions for how the AI should behave. Leave empty for default behavior.
          </Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            placeholder="e.g. You are a supportive mentor who uses the Socratic method..."
            placeholderTextColor={Colors.textMuted}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Prompts</Text>
          <Text style={styles.sectionHint}>
            Questions users can tap to start a conversation
          </Text>
          {prompts.map((prompt, index) => (
            <TextInput
              key={index}
              style={[styles.input, styles.promptInput]}
              placeholder={`Prompt ${index + 1}`}
              placeholderTextColor={Colors.textMuted}
              value={prompt}
              onChangeText={(v) => updatePrompt(index, v)}
            />
          ))}
        </View>

        {isEditing && existingCoach?.isCustom && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 color="#EF4444" size={20} />
            <Text style={styles.deleteText}>Delete Coach</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
    marginTop: -8,
  },
  avatarRow: {
    flexDirection: "row",
    gap: 12,
  },
  avatarOption: {
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorSelected: {
    borderWidth: 4,
    borderColor: Colors.navy,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  textAreaLarge: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  promptInput: {
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});
