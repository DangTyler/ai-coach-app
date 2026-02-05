import { Stack } from 'expo-router';
import { OnboardingProvider } from './context';
import { TutorialProvider } from './tutorial-context';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <TutorialProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="steps/WelcomeStep" />
          <Stack.Screen name="steps/ProfileStep" />
          <Stack.Screen name="steps/TutorialStep" />
          <Stack.Screen name="steps/AchievementStep" />
          <Stack.Screen name="steps/StreakStep" />
          <Stack.Screen name="steps/PersonalizeStep" />
          <Stack.Screen name="steps/CompleteStep" />
        </Stack>
      </TutorialProvider>
    </OnboardingProvider>
  );
}
