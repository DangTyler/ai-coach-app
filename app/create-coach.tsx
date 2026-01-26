import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Check, Trash2 } from "lucide-react-native";
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
import { useCoaches, coachCategories } from "@/contexts/CoachContext";

export default function CreateCoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { addCoach, updateCoach, deleteCoach, getCoach, defaultAvatars, defaultColors } = useCoaches();

  const existingCoach = editId ? getCoach(editId) : undefined;
  const isEditing = !!existingCoach;

  const [name, setName] = useState(existingCoach?.name || "");
  const [tagline, setTagline] = useState(existingCoach?.tagline || "");
  const [category, setCategory] = useState(existingCoach?.category || coachCategories[0]);
  const [promise, setPromise] = useState(existingCoach?.promise || "");
  const [systemPrompt, setSystemPrompt] = useState(existingCoach?.systemPrompt || "");
  const [avatar, setAvatar] = useState(existingCoach?.avatar || defaultAvatars[0]);
  const [color, setColor] = useState(existingCoach?.color || defaultColors[0]);
  const [prompts, setPrompts] = useState<string[]>(existingCoach?.prompts || ["", "", ""]);

  useEffect(() => {
    if (existingCoach) {
      setName(existingCoach.name);
      setTagline(existingCoach.tagline);
      setCategory(existingCoach.category);
      setPromise(existingCoach.promise);
      setSystemPrompt(existingCoach.systemPrompt || "");
      setAvatar(existingCoach.avatar);
      setColor(existingCoach.color);
      setPrompts(existingCoach.prompts.length ? existingCoach.prompts : ["", "", ""]);
    }
  }, [existingCoach]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a coach name");
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
      promise: promise.trim() || `I'm ${name.trim()}, ready to help you.`,
      systemPrompt: systemPrompt.trim(),
      avatar,
      color,
      prompts: prompts.filter(p => p.trim()),
    };

    if (isEditing && editId) {
      updateCoach(editId, coachData);
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
            if (editId) {
              deleteCoach(editId);
              router.back();
            }
          },
        },
      ]
    );
  };

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Coach" : "Create Coach",
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Check color={Colors.navy} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={[styles.selectedAvatarRing, { borderColor: color }]}>
            <Image source={{ uri: avatar }} style={styles.selectedAvatar} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
            {defaultAvatars.map((av, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setAvatar(av)}
                style={[
                  styles.avatarOption,
                  avatar === av && { borderColor: color, borderWidth: 2 },
                ]}
              >
                <Image source={{ uri: av }} style={styles.avatarOptionImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.colorSection}>
          <Text style={styles.sectionLabel}>Theme Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.colorList}>
              {defaultColors.map((c, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                >
                  {color === c && <Check color={Colors.white} size={16} />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Alex the Fitness Coach"
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Tagline *</Text>
          <TextInput
            style={styles.input}
            value={tagline}
            onChangeText={setTagline}
            placeholder="e.g., Your Personal Fitness Expert"
            placeholderTextColor={Colors.textMuted}
            maxLength={60}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryList}>
              {coachCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    category === cat && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && { color: Colors.white },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Promise / Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={promise}
            onChangeText={setPromise}
            placeholder="Describe what this coach helps with..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>System Prompt (Advanced)</Text>
          <Text style={styles.helperText}>
            Custom instructions for how this coach should behave. Leave empty for default behavior.
          </Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            placeholder="e.g., You are a strict but encouraging fitness coach. Always ask about workout progress..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            maxLength={1000}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Suggested Prompts</Text>
          <Text style={styles.helperText}>
            Quick prompts users can tap to start a conversation
          </Text>
          {prompts.map((prompt, index) => (
            <TextInput
              key={index}
              style={[styles.input, { marginTop: index > 0 ? 8 : 0 }]}
              value={prompt}
              onChangeText={(v) => updatePrompt(index, v)}
              placeholder={`Prompt ${index + 1}`}
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
            />
          ))}
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 color={Colors.error} size={20} />
            <Text style={styles.deleteButtonText}>Delete Coach</Text>
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
  saveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  selectedAvatarRing: {
    padding: 4,
    borderRadius: 56,
    borderWidth: 3,
    marginBottom: 16,
  },
  selectedAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarList: {
    maxHeight: 60,
  },
  avatarOption: {
    marginHorizontal: 6,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  colorSection: {
    marginBottom: 24,
  },
  colorList: {
    flexDirection: "row",
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    transform: [{ scale: 1.1 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.navy,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  textAreaLarge: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  categoryList: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: Colors.error + "10",
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
  },
});
