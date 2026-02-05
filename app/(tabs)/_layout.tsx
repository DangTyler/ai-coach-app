import { Tabs, useRouter } from "expo-router";
import { BookOpen, MessageSquare, Settings } from "lucide-react-native";
import React from "react";
import { Platform, TouchableOpacity, View, StyleSheet } from "react-native";

import Colors from "@/constants/colors";

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        backBehavior="none"
        screenOptions={{
          tabBarActiveTintColor: Colors.navy,
          tabBarInactiveTintColor: Colors.textMuted,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopColor: Colors.borderLight,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 88 : 68,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="(library)"
          options={{
            title: "Library",
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: "Saved",
            headerShown: true,
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Settings color={Colors.navy} size={24} />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTitleStyle: {
              color: Colors.navy,
              fontWeight: '700',
              fontSize: 18,
            },
            tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
