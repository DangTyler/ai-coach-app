import { Stack } from "expo-router";
import React from "react";

import Colors from "@/constants/colors";

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.navy,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="coach/[id]"
        options={{
          title: "",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          title: "",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="coach/edit"
        options={{
          title: "Create Coach",
          headerBackTitle: "Back",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
