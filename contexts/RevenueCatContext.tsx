/**
 * RevenueCat subscription context: configure SDK, identify user, check entitlements,
 * present paywall and customer center. Entitlement: "AI Coach App Pro".
 * Products (Monthly, Yearly, Lifetime) are configured in RevenueCat dashboard and
 * shown via the RevenueCat Paywall.
 *
 * API keys: use production keys per platform in .env:
 * - EXPO_PUBLIC_REVENUECAT_API_KEY_IOS (Apple)
 * - EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID (Google)
 * Fallback: EXPO_PUBLIC_REVENUECAT_API_KEY (test key or single key for both).
 */
import createContextHook from "@nkzw/create-context-hook";
import type { CustomerInfo } from "react-native-purchases";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/contexts/AuthContext";

/** Entitlement identifier in RevenueCat dashboard — must match exactly. */
export const PRO_ENTITLEMENT_ID = "AI Coach App Pro";

function getRevenueCatApiKey(): string {
  if (typeof process === "undefined") return "";
  const env = process.env as Record<string, string | undefined>;
  if (Platform.OS === "ios" && env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS) {
    return env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
  }
  if (Platform.OS === "android" && env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID) {
    return env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
  }
  return env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "";
}

const apiKey = getRevenueCatApiKey();

const isNative =
  typeof navigator !== "undefined" &&
  /react-native|expo/i.test(navigator?.userAgent ?? "");

function isProFromCustomerInfo(info: CustomerInfo | null): boolean {
  if (!info?.entitlements?.active) return false;
  return typeof info.entitlements.active[PRO_ENTITLEMENT_ID] !== "undefined";
}

export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  const { user, isAuthenticated } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchCustomerInfo = useCallback(async () => {
    if (!apiKey) {
      setIsLoading(false);
      return;
    }
    setError(null);
    try {
      const getInfo = Purchases.getCustomerInfo?.();
      if (getInfo && typeof getInfo.then === "function") {
        const info = await getInfo;
        setCustomerInfo(info);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load subscription";
      setError(message.includes("finally") ? "Subscription unavailable in this environment." : message);
      setCustomerInfo(null);
    }
    setIsLoading(false);
  }, []);

  // Configure SDK once and identify user when they log in
  useEffect(() => {
    if (!apiKey) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        }
        Purchases.configure({ apiKey });
        const getInfo = Purchases.getCustomerInfo?.();
        if (getInfo && typeof getInfo.then === "function") {
          const info = await getInfo;
          if (!cancelled) setCustomerInfo(info);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg.includes("finally") ? "Subscription service unavailable in this environment." : msg || "RevenueCat configure failed");
        }
      }
      if (!cancelled) setIsLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // When user logs in, identify them in RevenueCat so purchases are tied to their account
  useEffect(() => {
    if (!apiKey || !isAuthenticated || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        await Purchases.logIn(user.id);
        const info = await Purchases.getCustomerInfo();
        if (!cancelled) setCustomerInfo(info);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "RevenueCat logIn failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  // Listen for customer info updates (e.g. after purchase or restore)
  useEffect(() => {
    if (!apiKey) return;
    try {
      const listener = (info: CustomerInfo) => setCustomerInfo(info);
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => {
        try {
          Purchases.removeCustomerInfoUpdateListener(listener);
        } catch (_) {}
      };
    } catch (_) {
      // SDK may not support listener in this environment
    }
  }, []);

  const isPro = isProFromCustomerInfo(customerInfo);

  const presentPaywall = useCallback(async (): Promise<PAYWALL_RESULT | null> => {
    if (!apiKey) return null;
    setError(null);
    try {
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });
      await refetchCustomerInfo();
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not show paywall";
      setError(message);
      return null;
    }
  }, [refetchCustomerInfo]);

  /** Present paywall only if user does not have the Pro entitlement. */
  const presentPaywallIfNeeded = useCallback(async (): Promise<PAYWALL_RESULT | null> => {
    if (!apiKey) return null;
    if (isPro) return PAYWALL_RESULT.PURCHASED;
    setError(null);
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
        displayCloseButton: true,
      });
      await refetchCustomerInfo();
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not show paywall";
      setError(message);
      return null;
    }
  }, [isPro, refetchCustomerInfo]);

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    if (!apiKey) return;
    setError(null);
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: () => refetchCustomerInfo(),
          onRestoreFailed: ({ error: err }) =>
            setError(err?.message ?? "Restore failed"),
        },
      });
      await refetchCustomerInfo();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open Customer Center");
    }
  }, [refetchCustomerInfo]);

  return {
    customerInfo,
    isPro,
    isLoading,
    error,
    refetchCustomerInfo,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    isNativeIAPSupported: !!apiKey && isNative,
  };
});
