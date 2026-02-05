import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useOnboarding } from './context';
import WelcomeStep from './steps/WelcomeStep';
import ProfileStep from './steps/ProfileStep';
import TutorialStep from './steps/TutorialStep';
import AchievementStep from './steps/AchievementStep';
import StreakStep from './steps/StreakStep';
import PersonalizeStep from './steps/PersonalizeStep';
import CompleteStep from './steps/CompleteStep';
import Colors from '@/constants/colors';

function StepRenderer({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <WelcomeStep />;
    case 2:
      return <ProfileStep />;
    case 3:
      return <TutorialStep />;
    case 4:
      return <AchievementStep />;
    case 5:
      return <StreakStep />;
    case 6:
      return <PersonalizeStep />;
    case 7:
      return <CompleteStep />;
    default:
      return <WelcomeStep />;
  }
}

export default function OnboardingIndex() {
  const { currentStep, isLoading } = useOnboarding();

  console.log('[Onboarding] currentStep:', currentStep, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return <StepRenderer step={currentStep} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
