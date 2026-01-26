import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';

import { Coach, categories } from '@/mocks/coaches';

const CUSTOM_COACHES_KEY = 'custom_coaches';

export interface CustomCoach extends Coach {
  isCustom: true;
  systemPrompt?: string;
}

const defaultAvatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=face',
];

const defaultColors = [
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

export const coachCategories = categories.filter(c => c !== 'All');

export const [CoachProvider, useCoaches] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [customCoaches, setCustomCoaches] = useState<CustomCoach[]>([]);

  const { data: storedCoaches, isLoading } = useQuery({
    queryKey: ['customCoaches'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CUSTOM_COACHES_KEY);
      return stored ? JSON.parse(stored) as CustomCoach[] : [];
    },
  });

  useEffect(() => {
    if (storedCoaches) {
      setCustomCoaches(storedCoaches);
    }
  }, [storedCoaches]);

  const saveMutation = useMutation({
    mutationFn: async (coaches: CustomCoach[]) => {
      await AsyncStorage.setItem(CUSTOM_COACHES_KEY, JSON.stringify(coaches));
      return coaches;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customCoaches'] });
    },
  });

  const addCoach = useCallback((coach: Omit<CustomCoach, 'id' | 'isCustom'>) => {
    const newCoach: CustomCoach = {
      ...coach,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };
    const updated = [...customCoaches, newCoach];
    setCustomCoaches(updated);
    saveMutation.mutate(updated);
    return newCoach.id;
  }, [customCoaches, saveMutation]);

  const updateCoach = useCallback((id: string, updates: Partial<Omit<CustomCoach, 'id' | 'isCustom'>>) => {
    const updated = customCoaches.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    setCustomCoaches(updated);
    saveMutation.mutate(updated);
  }, [customCoaches, saveMutation]);

  const deleteCoach = useCallback((id: string) => {
    const updated = customCoaches.filter(c => c.id !== id);
    setCustomCoaches(updated);
    saveMutation.mutate(updated);
  }, [customCoaches, saveMutation]);

  const getCoach = useCallback((id: string): CustomCoach | undefined => {
    return customCoaches.find(c => c.id === id);
  }, [customCoaches]);

  return {
    customCoaches,
    isLoading,
    addCoach,
    updateCoach,
    deleteCoach,
    getCoach,
    defaultAvatars,
    defaultColors,
  };
});
