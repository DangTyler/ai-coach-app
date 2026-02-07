// root layout
// force rebundle v3
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { trpc, trpcClient } from "@/lib/trpc";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { CoachProvider } from "@/contexts/CoachContext";
import { onboardingStorage } from "@/app/onboarding/storage";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

function RootLayoutWithAuth() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (isAuthLoading || isCheckingOnboarding) return;

    const inAuth = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    const navigate = async () => {
      const completed = await onboardingStorage.isComplete();

      if (completed !== isOnboardingComplete) {
        setIsOnboardingComplete(completed);
        return;
      }

      if (!isAuthenticated && !inAuth) {
        console.log("[Nav] Not authenticated, redirecting to auth");
        router.replace("/auth/login" as any);
      } else if (isAuthenticated && inAuth) {
        if (!completed) {
          console.log("[Nav] Authenticated, onboarding incomplete, redirecting to onboarding");
          router.replace("/onboarding" as any);
        } else {
          console.log("[Nav] Authenticated, redirecting to tabs");
          router.replace("/(tabs)" as any);
        }
      } else if (isAuthenticated && !completed && !inOnboarding && !inAuth) {
        console.log("[Nav] Onboarding not complete, redirecting");
        router.replace("/onboarding" as any);
      } else if (isAuthenticated && completed && inOnboarding) {
        console.log("[Nav] Onboarding complete, redirecting to tabs");
        router.replace("/(tabs)" as any);
      }
    };

    navigate();
  }, [isAuthLoading, isCheckingOnboarding, isAuthenticated, isOnboardingComplete, segments, router]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await onboardingStorage.isComplete();
      setIsOnboardingComplete(completed);
    } catch (error) {
      console.error("[Nav] Error checking onboarding status:", error);
    } finally {
      setIsCheckingOnboarding(false);
      SplashScreen.hideAsync();
    }
  };

  if (isAuthLoading || isCheckingOnboarding) {
    return null;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <AuthProvider>
            <CoachProvider>
              <ChatProvider>
                <RootLayoutWithAuth />
              </ChatProvider>
            </CoachProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
