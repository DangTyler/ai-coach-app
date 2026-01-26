import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Trash2, Camera } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useCoaches } from "@/contexts/CoachContext";
import { categories } from "@/mocks/coaches";

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
];

const COLOR_OPTIONS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#14B8A6",
  "#3B82F6",
  "#EF4444",
  "#059669",
];

export default function CoachEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCoach, addCoach, updateCoach, deleteCoach, isCustomCoach } = useCoaches();

  const isEditing = !!id;
  const existingCoach = id ? getCoach(id) : undefined;
  const canEdit = !id || isCustomCoach(id);

  const [name, setName] = useState(existingCoach?.name || "");
  const [tagline, setTagline] = useState(existingCoach?.tagline || "");
  const [category, setCategory] = useState(existingCoach?.category || categories[1]);
  const [avatar, setAvatar] = useState(existingCoach?.avatar || AVATAR_OPTIONS[0]);
  const [promise, setPromise] = useState(existingCoach?.promise || "");
  const [prompts, setPrompts] = useState<string[]>(existingCoach?.prompts || ["", "", ""]);
  const [color, setColor] = useState(existingCoach?.color || COLOR_OPTIONS[0]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (existingCoach) {
      setName(existingCoach.name);
      setTagline(existingCoach.tagline);
      setCategory(existingCoach.category);
      setAvatar(existingCoach.avatar);
      setPromise(existingCoach.promise);
      setPrompts(existingCoach.prompts.length > 0 ? existingCoach.prompts : ["", "", ""]);
      setColor(existingCoach.color);
    }
  }, [existingCoach]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a name for your coach.");
      return;
    }
    if (!tagline.trim()) {
      Alert.alert("Missing Tagline", "Please enter a tagline for your coach.");
      return;
    }
    if (!promise.trim()) {
      Alert.alert("Missing Promise", "Please describe what your coach does.");
      return;
    }

    const filteredPrompts = prompts.filter((p) => p.trim());
    if (filteredPrompts.length === 0) {
      Alert.alert("Missing Prompts", "Please add at least one example prompt.");
      return;
    }

    const coachData = {
      name: name.trim(),
      tagline: tagline.trim(),
      category,
      avatar,
      promise: promise.trim(),
      prompts: filteredPrompts,
      color,
    };

    if (isEditing && id) {
      updateCoach(id, coachData);
      Alert.alert("Success", "Coach updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      const newId = addCoach(coachData);
      Alert.alert("Success", "Coach created successfully!", [
        { text: "OK", onPress: () => router.replace(`/coach/${newId}`) },
      ]);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete Coach",
      "Are you sure you want to delete this coach? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCoach(id);
            router.replace("/(tabs)/(library)");
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

  const filteredCategories = categories.filter((c) => c !== "All");

  if (isEditing && !canEdit) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Cannot Edit" }} />
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Cannot Edit Default Coach</Text>
          <Text style={styles.errorSubtitle}>
            You can only edit coaches you've created.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Coach" : "Create Coach",
          headerRight: isEditing
            ? () => (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Trash2 color="#EF4444" size={22} />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={[styles.avatarSection, { backgroundColor: color + "15" }]}
          onPress={() => setShowAvatarPicker(!showAvatarPicker)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarRing, { borderColor: color + "40" }]}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={[styles.cameraIcon, { backgroundColor: color }]}>
              <Camera color={Colors.white} size={16} />
            </View>
          </View>
          <Text style={styles.changeAvatarText}>Tap to change avatar</Text>
        </TouchableOpacity>

        {showAvatarPicker && (
          <View style={styles.avatarPicker}>
            <Text style={styles.pickerLabel}>Choose Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarOption,
                    avatar === url && { borderColor: color, borderWidth: 3 },
                  ]}
                  onPress={() => {
                    setAvatar(url);
                    setShowAvatarPicker(false);
                  }}
                >
                  <Image source={{ uri: url }} style={styles.avatarOptionImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Theme Color</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorOptionSelected,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && <View style={styles.colorCheck} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Coach Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dr. Sarah Mitchell"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tagline *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Executive Career Strategist"
            placeholderTextColor={Colors.textMuted}
            value={tagline}
            onChangeText={setTagline}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setCategory(cat)}
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
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Coach Promise / Description *</Text>
          <Text style={styles.sectionHint}>
            Describe what this coach specializes in and how they help users
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="I help ambitious professionals..."
            placeholderTextColor={Colors.textMuted}
            value={promise}
            onChangeText={setPromise}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Example Prompts *</Text>
          <Text style={styles.sectionHint}>
            Add 1-3 example questions users can ask this coach
          </Text>
          {prompts.map((prompt, index) => (
            <TextInput
              key={index}
              style={[styles.input, styles.promptInput]}
              placeholder={`Example prompt ${index + 1}`}
              placeholderTextColor={Colors.textMuted}
              value={prompt}
              onChangeText={(text) => updatePrompt(index, text)}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: color }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? "Save Changes" : "Create Coach"}
          </Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    paddingBottom: 24,
  },
  deleteButton: {
    padding: 8,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 56,
    borderWidth: 3,
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changeAvatarText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  avatarPicker: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.navy,
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  avatarOption: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionImage: {
    width: 52,
    height: 52,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.navy,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 10,
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
    minHeight: 120,
    paddingTop: 14,
  },
  promptInput: {
    marginBottom: 10,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.navy,
  },
  colorCheck: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  categoryList: {
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
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
