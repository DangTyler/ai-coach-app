import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';

import { setAuthToken } from '@/lib/auth-token';
import { trpc } from '@/lib/trpc';

const AUTH_TOKEN_KEY = 'auth_token';

interface User {
  id: string;
  email: string;
  name: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();
  const clearSessionRef = useRef<(() => Promise<void>) | null>(null);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        console.log('[Auth] Found stored token, restoring session');
        setToken(storedToken);
        setAuthToken(storedToken);
      }
    } catch (error) {
      console.log('[Auth] Error loading stored token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token && !isAuthenticated,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      console.log('[Auth] Session restored for:', meQuery.data.email);
      setUser(meQuery.data);
      setIsAuthenticated(true);
    }
    if (meQuery.error) {
      console.log('[Auth] Session invalid, clearing token');
      clearSessionRef.current?.();

    }
  }, [meQuery.data, meQuery.error]);

  const saveSession = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setAuthToken(authToken);
    setIsAuthenticated(true);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
    console.log('[Auth] Session saved for:', userData.email);
  };

  const clearSession = useCallback(async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    queryClient.clear();
    console.log('[Auth] Session cleared');
  }, [queryClient]);

  clearSessionRef.current = clearSession;


  const login = useCallback(async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    await saveSession(
      { id: result.id, email: result.email, name: result.name },
      result.token
    );
    return result;
  }, [loginMutation]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await registerMutation.mutateAsync({ email, password, name });
    await saveSession(
      { id: result.id, email: result.email, name: result.name },
      result.token
    );
    return result;
  }, [registerMutation]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.log('[Auth] Logout API call failed, clearing locally:', error);
    }
    await clearSession();
  }, [logoutMutation, clearSession]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    loginError: loginMutation.error?.message ?? null,
    registerError: registerMutation.error?.message ?? null,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
});
