import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: '@onboarding_complete',
  ONBOARDING_STEP: '@onboarding_step',
  ONBOARDING_DATA: '@onboarding_data',
};

export interface OnboardingData {
  name?: string;
  goal?: 'learn' | 'improve' | 'explore';
  practiceTime?: 'morning' | 'afternoon' | 'evening';
  xp?: number;
}

export const onboardingStorage = {
  async isComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch {
      return false;
    }
  },

  async markComplete(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },

  async getStep(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP);
      return value ? parseInt(value, 10) : 1;
    } catch {
      return 1;
    }
  },

  async setStep(step: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, step.toString());
  },

  async getData(): Promise<OnboardingData> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA);
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  },

  async saveData(data: Partial<OnboardingData>): Promise<void> {
    const current = await this.getData();
    const updated = { ...current, ...data };
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(updated));
  },

  async reset(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      STORAGE_KEYS.ONBOARDING_STEP,
      STORAGE_KEYS.ONBOARDING_DATA,
    ]);
  },
};
