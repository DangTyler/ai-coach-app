import React from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useOnboarding } from './context';
import WelcomeStep from './steps/WelcomeStep';
import ProfileStep from './steps/ProfileStep';
import CoachCreationStep from './steps/CoachCreationStep';
import TutorialStep from './steps/TutorialStep';
import CompleteStep from './steps/CompleteStep';
import Colors from '@/constants/colors';
import ConfettiEffect from '@/components/onboarding/ConfettiEffect';

const { width, height } = Dimensions.get('window');

function StepRenderer({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <WelcomeStep />;
    case 2:
      return <ProfileStep />;
    case 3:
      return <CoachCreationStep />;
    case 4:
      return <TutorialStep />;
    case 5:
      return <CompleteStep />;
    default:
      return <WelcomeStep />;
  }
}

export default function OnboardingIndex() {
  const { currentStep, isLoading, confettiTrigger, confettiIntensity } = useOnboarding();

  console.log('[Onboarding] currentStep:', currentStep, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StepRenderer step={currentStep} />
      <View style={styles.confettiContainer} pointerEvents="none">
        <ConfettiEffect 
          trigger={confettiTrigger} 
          intensity={confettiIntensity}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 9999,
  },
});
