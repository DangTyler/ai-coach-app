import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useEffect } from 'react';

import { Coach, coaches as defaultCoaches, categories as defaultCategories } from '@/mocks/coaches';

const CUSTOM_COACHES_KEY = 'custom_coaches';

export interface CustomCoach extends Coach {
  isCustom: boolean;
  systemPrompt?: string;
}

const avatarOptions = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
];

const colorOptions = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#14B8A6',
  '#3B82F6',
  '#EF4444',
  '#059669',
];

export { avatarOptions, colorOptions, defaultCategories };

export const [CoachProvider, useCoaches] = createContextHook(() => {
  const [customCoaches, setCustomCoaches] = useState<CustomCoach[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomCoaches();
  }, []);

  const loadCustomCoaches = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_COACHES_KEY);
      if (stored) {
        setCustomCoaches(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading custom coaches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomCoaches = async (coaches: CustomCoach[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_COACHES_KEY, JSON.stringify(coaches));
    } catch (error) {
      console.log('Error saving custom coaches:', error);
    }
  };

  const allCoaches = [...customCoaches, ...defaultCoaches.map(c => ({ ...c, isCustom: false } as CustomCoach))];

  const getCoachById = useCallback((id: string): CustomCoach | undefined => {
    const custom = customCoaches.find(c => c.id === id);
    if (custom) return custom;
    
    const defaultCoach = defaultCoaches.find(c => c.id === id);
    if (defaultCoach) return { ...defaultCoach, isCustom: false };
    
    return undefined;
  }, [customCoaches]);

  const addCoach = useCallback((coach: Omit<CustomCoach, 'id' | 'isCustom'>) => {
    const newCoach: CustomCoach = {
      ...coach,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };
    const updated = [newCoach, ...customCoaches];
    setCustomCoaches(updated);
    saveCustomCoaches(updated);
    return newCoach.id;
  }, [customCoaches]);

  const updateCoach = useCallback((id: string, updates: Partial<Omit<CustomCoach, 'id' | 'isCustom'>>) => {
    const updated = customCoaches.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    setCustomCoaches(updated);
    saveCustomCoaches(updated);
  }, [customCoaches]);

  const deleteCoach = useCallback((id: string) => {
    const updated = customCoaches.filter(c => c.id !== id);
    setCustomCoaches(updated);
    saveCustomCoaches(updated);
  }, [customCoaches]);

  return {
    allCoaches,
    customCoaches,
    isLoading,
    getCoachById,
    addCoach,
    updateCoach,
    deleteCoach,
  };
});
