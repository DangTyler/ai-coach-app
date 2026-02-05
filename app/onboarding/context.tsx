import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { onboardingStorage, OnboardingData } from './storage';

type ConfettiIntensity = 'small' | 'medium' | 'large';

interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  xp: number;
  data: OnboardingData;
  isLoading: boolean;
  confettiTrigger: boolean;
  confettiIntensity: ConfettiIntensity;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addXp: (amount: number) => void;
  updateData: (data: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<void>;
  triggerConfetti: (intensity?: ConfettiIntensity) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [xp, setXp] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState<ConfettiIntensity>('medium');

  const TOTAL_STEPS = 5;

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    const [step, savedData] = await Promise.all([
      onboardingStorage.getStep(),
      onboardingStorage.getData(),
    ]);
    setCurrentStep(step);
    setData(savedData);
    setXp(savedData.xp || 0);
    setIsLoading(false);
  };

  const goToStep = useCallback(async (step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
      await onboardingStorage.setStep(step);
    }
  }, []);

  const nextStep = useCallback(async () => {
    console.log('[Onboarding] nextStep called, currentStep:', currentStep);
    if (currentStep < TOTAL_STEPS) {
      const next = currentStep + 1;
      console.log('[Onboarding] advancing to step:', next);
      setCurrentStep(next);
      await onboardingStorage.setStep(next);
    } else {
      console.log('[Onboarding] already at final step');
    }
  }, [currentStep]);

  const prevStep = useCallback(async () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      await onboardingStorage.setStep(prev);
    }
  }, [currentStep]);

  const addXp = useCallback(async (amount: number) => {
    setXp((prev) => {
      const newXp = prev + amount;
      onboardingStorage.saveData({ xp: newXp });
      return newXp;
    });
  }, []);

  const updateData = useCallback(async (newData: Partial<OnboardingData>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      onboardingStorage.saveData(updated);
      return updated;
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await onboardingStorage.markComplete();
  }, []);

  const triggerConfetti = useCallback((intensity: ConfettiIntensity = 'medium') => {
    setConfettiTrigger(false);
    setConfettiIntensity(intensity);
    // Small delay to ensure state reset is processed
    setTimeout(() => {
      setConfettiTrigger(true);
    }, 10);
    // Auto-reset after animation
    setTimeout(() => {
      setConfettiTrigger(false);
    }, 3500);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        totalSteps: TOTAL_STEPS,
        xp,
        data,
        isLoading,
        confettiTrigger,
        confettiIntensity,
        goToStep,
        nextStep,
        prevStep,
        addXp,
        updateData,
        completeOnboarding,
        triggerConfetti,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
