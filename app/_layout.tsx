// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ChatProvider } from "@/contexts/ChatContext";
import { CoachProvider } from "@/contexts/CoachContext";
import { onboardingStorage } from "@/app/onboarding/storage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="settings" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}

function RootLayoutWithOnboarding() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    const handleNavigation = async () => {
      if (!isLoading) {
        const inOnboarding = segments[0] === 'onboarding';
        
        // Re-check storage in case it was updated
        const completed = await onboardingStorage.isComplete();
        
        if (completed !== isOnboardingComplete) {
          setIsOnboardingComplete(completed);
          return; // Let the next effect run handle navigation
        }
        
        if (!completed && !inOnboarding) {
          // Redirect to onboarding if not complete
          router.replace('/onboarding' as any);
        } else if (completed && inOnboarding) {
          // Redirect to main app if onboarding is complete
          router.replace('/(tabs)' as any);
        }
      }
    };
    
    handleNavigation();
  }, [isLoading, isOnboardingComplete, segments]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await onboardingStorage.isComplete();
      setIsOnboardingComplete(completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
      SplashScreen.hideAsync();
    }
  };

  if (isLoading) {
    return null;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <CoachProvider>
          <ChatProvider>
            <RootLayoutWithOnboarding />
          </ChatProvider>
        </CoachProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
