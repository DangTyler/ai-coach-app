/**
 * Credits state: balance from backend, use-credit mutation, refetch.
 * Used for chat (deduct per message) and display in header/Settings.
 */
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect } from "react";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export const [CreditsProvider, useCreditsContext] = createContextHook(() => {
  const { isAuthenticated, user } = useAuth();

  const balanceQuery = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Refetch when user becomes available (e.g. right after login/register) so credits load reliably
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      balanceQuery.refetch();
    }
  }, [user?.id, isAuthenticated, balanceQuery.refetch]);

  const useCreditMutation = trpc.credits.use.useMutation({
    onSuccess: () => {
      balanceQuery.refetch();
    },
  });

  const useCredit = useCallback(
    async (amount: number): Promise<{ success: boolean; error?: string }> => {
      try {
        await useCreditMutation.mutateAsync({ amount });
        return { success: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Insufficient credits";
        return { success: false, error: message };
      }
    },
    [useCreditMutation]
  );

  const refetch = useCallback(() => {
    balanceQuery.refetch();
  }, [balanceQuery]);

  return {
    credits: balanceQuery.data?.credits ?? 0,
    nextDailyRefillAt: balanceQuery.data?.nextDailyRefillAt,
    isLoading: balanceQuery.isLoading,
    error: balanceQuery.error?.message ?? useCreditMutation.error?.message ?? null,
    refetch,
    useCredit,
    isUsingCredit: useCreditMutation.isPending,
  };
});
