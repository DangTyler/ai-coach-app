import React, { createContext, useContext, useState, useCallback } from 'react';

interface SpotlightTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: string | null;
  spotlightTarget: SpotlightTarget | null;
  tooltipText: string;
  startTutorial: (step: string, target: SpotlightTarget, tooltip: string) => void;
  endTutorial: () => void;
  completeStep: (step: string) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [spotlightTarget, setSpotlightTarget] = useState<SpotlightTarget | null>(null);
  const [tooltipText, setTooltipText] = useState('');

  const startTutorial = useCallback((step: string, target: SpotlightTarget, tooltip: string) => {
    setCurrentStep(step);
    setSpotlightTarget(target);
    setTooltipText(tooltip);
    setIsActive(true);
  }, []);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(null);
    setSpotlightTarget(null);
    setTooltipText('');
  }, []);

  const completeStep = useCallback((step: string) => {
    if (currentStep === step) {
      endTutorial();
    }
  }, [currentStep, endTutorial]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        spotlightTarget,
        tooltipText,
        startTutorial,
        endTutorial,
        completeStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
