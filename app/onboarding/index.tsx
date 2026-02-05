import { useEffect, useState } from 'react';
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

const steps = [
  WelcomeStep,
  ProfileStep,
  TutorialStep,
  AchievementStep,
  StreakStep,
  PersonalizeStep,
  CompleteStep,
];

export default function OnboardingIndex() {
  const { currentStep, isLoading } = useOnboarding();
  const [StepComponent, setStepComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (!isLoading && currentStep >= 1 && currentStep <= steps.length) {
      setStepComponent(() => steps[currentStep - 1]);
    }
  }, [currentStep, isLoading]);

  if (isLoading || !StepComponent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return <StepComponent />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
