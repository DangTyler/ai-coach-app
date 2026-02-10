import { useRouter } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Dev note: Edit the line below and save — if the app updates, Expo hot reload is working.
const EXPO_DEV_NOTE = "Expo is updating correctly. (Edit this file and save to confirm.)";

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.noteBox}>
        <Text style={styles.noteLabel}>Dev</Text>
        <Text style={styles.noteText}>{EXPO_DEV_NOTE}</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/onboarding")}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue to app</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  noteBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  noteText: {
    fontSize: 15,
    color: "#333",
  },
  button: {
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
