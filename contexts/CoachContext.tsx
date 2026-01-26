import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';

import { Coach, coaches as defaultCoaches } from '@/mocks/coaches';

const CUSTOM_COACHES_KEY = 'custom_coaches';

export const [CoachProvider, useCoaches] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [customCoaches, setCustomCoaches] = useState<Coach[]>([]);

  const { data: storedCoaches, isLoading } = useQuery({
    queryKey: ['customCoaches'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CUSTOM_COACHES_KEY);
      return stored ? JSON.parse(stored) as Coach[] : [];
    },
  });

  useEffect(() => {
    if (storedCoaches) {
      setCustomCoaches(storedCoaches);
    }
  }, [storedCoaches]);

  const saveMutation = useMutation({
    mutationFn: async (coaches: Coach[]) => {
      await AsyncStorage.setItem(CUSTOM_COACHES_KEY, JSON.stringify(coaches));
      return coaches;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customCoaches'] });
    },
  });

  const allCoaches = [...customCoaches, ...defaultCoaches];

  const getCoach = useCallback((id: string): Coach | undefined => {
    return allCoaches.find((c) => c.id === id);
  }, [allCoaches]);

  const isCustomCoach = useCallback((id: string): boolean => {
    return customCoaches.some((c) => c.id === id);
  }, [customCoaches]);

  const addCoach = useCallback((coach: Omit<Coach, 'id'>) => {
    const newCoach: Coach = {
      ...coach,
      id: `custom-${Date.now()}`,
    };
    const updated = [newCoach, ...customCoaches];
    setCustomCoaches(updated);
    saveMutation.mutate(updated);
    return newCoach.id;
  }, [customCoaches, saveMutation]);

  const updateCoach = useCallback((id: string, updates: Partial<Coach>) => {
    const updated = customCoaches.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    setCustomCoaches(updated);
    saveMutation.mutate(updated);
  }, [customCoaches, saveMutation]);

  const deleteCoach = useCallback((id: string) => {
    const updated = customCoaches.filter((c) => c.id !== id);
    setCustomCoaches(updated);
    saveMutation.mutate(updated);
  }, [customCoaches, saveMutation]);

  return {
    coaches: allCoaches,
    customCoaches,
    defaultCoaches,
    isLoading,
    getCoach,
    isCustomCoach,
    addCoach,
    updateCoach,
    deleteCoach,
  };
});
