import { useRouter } from "expo-router";
import { ChevronLeft, Moon, Sun, RotateCcw, ChevronRight, User, Sparkles } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';

import Colors from "@/constants/colors";
import { onboardingStorage } from "@/app/onboarding/storage";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingBackground, setEditingBackground] = useState('');
  const [editingGoals, setEditingGoals] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    const context = await onboardingStorage.getUserContext();
    if (context) {
      setEditingName(context.name);
      setEditingBackground(context.background || '');
      setEditingGoals(context.goals || '');
    }
  };

  const handleNameChange = (text: string) => {
    setEditingName(text);
    setHasChanges(true);
  };

  const handleBackgroundChange = (text: string) => {
    setEditingBackground(text);
    setHasChanges(true);
  };

  const handleGoalsChange = (text: string) => {
    setEditingGoals(text);
    setHasChanges(true);
  };

  const handleSaveContext = async () => {
    await onboardingStorage.saveUserContext({
      name: editingName,
      background: editingBackground,
      goals: editingGoals,
    });
    console.log('[Settings] User context saved:', { name: editingName, background: editingBackground, goals: editingGoals });
    setHasChanges(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Your profile has been updated!');
  };

  const toggleDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    // TODO: Implement actual theme switching logic
    // This would typically update a global theme context
  };

  const handleReplayOnboarding = async () => {
    await onboardingStorage.reset();
    router.replace('/onboarding' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft color={Colors.navy} size={28} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: Colors.accentLight },
                  ]}
                >
                  {isDarkMode ? (
                    <Moon color={Colors.accent} size={20} />
                  ) : (
                    <Sun color={Colors.accent} size={20} />
                  )}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingDescription}>
                    Switch between light and dark themes
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{
                  false: Colors.border,
                  true: Colors.accent,
                }}
                thumbColor={Colors.white}
                ios_backgroundColor={Colors.border}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.card}>
            <View style={styles.contextField}>
              <View style={styles.contextLabelRow}>
                <User color={Colors.accent} size={18} />
                <Text style={styles.contextLabel}>Name</Text>
              </View>
              <TextInput
                style={styles.contextInput}
                value={editingName}
                onChangeText={handleNameChange}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.contextField}>
              <View style={styles.contextLabelRow}>
                <Sparkles color={Colors.accent} size={18} />
                <Text style={styles.contextLabel}>Background</Text>
              </View>
              <TextInput
                style={[styles.contextInput, styles.contextInputMulti]}
                value={editingBackground}
                onChangeText={handleBackgroundChange}
                placeholder="Your current situation or background"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.contextField}>
              <View style={styles.contextLabelRow}>
                <Sparkles color={Colors.accent} size={18} />
                <Text style={styles.contextLabel}>Goals</Text>
              </View>
              <TextInput
                style={[styles.contextInput, styles.contextInputMulti]}
                value={editingGoals}
                onChangeText={handleGoalsChange}
                placeholder="What are you hoping to achieve?"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <Text style={styles.contextHint}>
                Coaches will use this to personalize your conversations
              </Text>
            </View>
            {hasChanges && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveContext}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onboarding</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleReplayOnboarding}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: Colors.accentLight },
                  ]}
                >
                  <RotateCcw color={Colors.accent} size={20} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Replay Onboarding</Text>
                  <Text style={styles.settingDescription}>
                    Walk through the tutorial again
                  </Text>
                </View>
              </View>
              <ChevronRight color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>2024.1</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  backText: {
    fontSize: 16,
    color: Colors.navy,
    fontWeight: "600",
    marginLeft: -4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.navy,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.navy,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.navy,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  contextField: {
    padding: 16,
  },
  contextLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginLeft: 8,
  },
  contextInput: {
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contextInputMulti: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  contextHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
