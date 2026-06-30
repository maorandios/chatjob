"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useCallback, useEffect, useMemo, useState } from "react";

type PushUserRole = "manager" | "worker";

type UsePushNotificationsOptions = {
  enabled: boolean;
  userRole?: PushUserRole;
  userId?: string;
};

type PushUnsubscribeOptions = {
  userRole?: PushUserRole;
  userId?: string;
  rememberDisabled?: boolean;
};

type PushSubscribeOptions = {
  userRole?: PushUserRole;
  userId?: string;
  requestPermission?: boolean;
};

type PushRegistrationState =
  | "unsupported"
  | "missing-key"
  | "disabled"
  | "default"
  | "denied"
  | "granted"
  | "subscribing"
  | "subscribed"
  | "failed";

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output.buffer;
}

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function getDisabledStorageKey(userRole?: PushUserRole, userId?: string) {
  if (!userRole || !userId) return null;
  return `jobchat-push-disabled:${userRole}:${userId}`;
}

function isLocallyDisabled(key: string | null): boolean {
  if (!key || typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "true";
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { "Content-Type": "application/json" };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { "Content-Type": "application/json" };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function unsubscribeCurrentPushDevice({
  userRole,
  userId,
  rememberDisabled = true,
}: PushUnsubscribeOptions): Promise<void> {
  if (!userRole || !userId || !isPushSupported()) return;

  const disabledStorageKey = getDisabledStorageKey(userRole, userId);
  if (rememberDisabled && disabledStorageKey) {
    window.localStorage.setItem(disabledStorageKey, "true");
  }

  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  const params = new URLSearchParams({
    userRole,
    userId,
    endpoint,
  });

  await fetch(`/api/push-subscriptions?${params.toString()}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });
}

export async function subscribeCurrentPushDevice({
  userRole,
  userId,
  requestPermission = false,
}: PushSubscribeOptions): Promise<NotificationPermission | null> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!userRole || !userId || !isPushSupported() || !publicKey) return null;

  const disabledStorageKey = getDisabledStorageKey(userRole, userId);
  if (disabledStorageKey) {
    window.localStorage.removeItem(disabledStorageKey);
  }

  const permission =
    Notification.permission === "default" && requestPermission
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== "granted") return permission;

  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(publicKey),
    }));

  const response = await fetch("/api/push-subscriptions", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      userRole,
      userId,
      subscription: subscription.toJSON(),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save push subscription");
  }

  return permission;
}

export function usePushNotifications({
  enabled,
  userRole,
  userId,
}: UsePushNotificationsOptions) {
  const supported = useMemo(() => isPushSupported(), []);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const disabledStorageKey = useMemo(
    () => getDisabledStorageKey(userRole, userId),
    [userId, userRole]
  );
  const [state, setState] = useState<PushRegistrationState>(() => {
    if (!supported) return "unsupported";
    if (!publicKey) return "missing-key";
    if (isLocallyDisabled(getDisabledStorageKey(userRole, userId))) {
      return "disabled";
    }
    return Notification.permission;
  });

  const subscribe = useCallback(
    async (requestPermission: boolean) => {
      if (!enabled || !userRole || !userId || !supported || !publicKey) return;

      try {
        const permission = await subscribeCurrentPushDevice({
          userRole,
          userId,
          requestPermission,
        });
        if (!permission) return;
        setState(permission);
        if (permission !== "granted") return;
        setState("subscribed");
      } catch (error) {
        setState("failed");
        console.warn("[Slang] Push registration failed", error);
      }
    },
    [enabled, publicKey, supported, userId, userRole]
  );

  const unsubscribe = useCallback(async () => {
    if (!enabled || !userRole || !userId || !supported) return;

    try {
      await unsubscribeCurrentPushDevice({ userRole, userId });
      setState("disabled");
    } catch (error) {
      setState("failed");
      console.warn("[Slang] Push unsubscribe failed", error);
    }
  }, [enabled, supported, userId, userRole]);

  useEffect(() => {
    if (!enabled || !supported || !publicKey) return;
    if (isLocallyDisabled(disabledStorageKey)) {
      const timeout = window.setTimeout(() => setState("disabled"), 0);
      return () => window.clearTimeout(timeout);
    }

    if (Notification.permission === "granted") {
      let cancelled = false;
      setState("subscribing");
      void subscribe(false)
        .catch(() => {
          if (!cancelled) setState("granted");
        });

      return () => {
        cancelled = true;
      };
    }
    const timeout = window.setTimeout(() => setState(Notification.permission), 0);
    return () => window.clearTimeout(timeout);
  }, [disabledStorageKey, enabled, publicKey, subscribe, supported]);

  return {
    state,
    isSupported: supported && Boolean(publicKey),
    isEnabled:
      state !== "unsupported" &&
      state !== "missing-key" &&
      state !== "disabled" &&
      state !== "denied" &&
      state !== "failed",
    requestPermissionAndSubscribe: () => subscribe(true),
    unsubscribe,
  };
}

