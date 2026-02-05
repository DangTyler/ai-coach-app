import { Tabs, useRouter } from "expo-router";
import { BookOpen, MessageSquare, Settings } from "lucide-react-native";
import React, { useRef, useEffect, useState } from "react";
import { Platform, TouchableOpacity, View, findNodeHandle, UIManager, Dimensions, StyleSheet, Animated } from "react-native";

import Colors from "@/constants/colors";
import SpotlightOverlay from "@/components/onboarding/SpotlightOverlay";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
  const router = useRouter();
  const [tutorialActive, setTutorialActive] = useState(false);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const libraryTabRef = useRef<View>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start tutorial after layout is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if we should show tutorial (this would typically come from onboarding context)
      // For now, we'll just demonstrate the spotlight functionality
      // In real implementation, this would check if we're in tutorial mode from onboarding step 3
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Pulse animation for tutorial highlight
  useEffect(() => {
    if (tutorialActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [tutorialActive, pulseAnim]);

  const measureLibraryTab = () => {
    if (libraryTabRef.current) {
      const handle = findNodeHandle(libraryTabRef.current);
      if (handle) {
        UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
          setSpotlightPosition({
            x: pageX,
            y: pageY,
            width,
            height,
          });
        });
      }
    }
  };

  const handleLibraryPress = () => {
    if (tutorialActive) {
      // Complete tutorial step
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTutorialActive(false);
    }
  };

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
            tabBarIcon: ({ color, size, focused }) => (
              <Animated.View
                ref={libraryTabRef}
                onLayout={measureLibraryTab}
                style={[
                  tutorialActive && focused && styles.tutorialHighlight,
                  tutorialActive && focused && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <BookOpen color={color} size={size} />
              </Animated.View>
            ),
          }}
          listeners={{
            tabPress: () => {
              handleLibraryPress();
            },
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

      {/* Tutorial Overlay */}
      {tutorialActive && (
        <SpotlightOverlay
          target={spotlightPosition}
          tooltip="Tap the Library tab to explore your coaches"
          onComplete={() => setTutorialActive(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tutorialHighlight: {
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    padding: 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
