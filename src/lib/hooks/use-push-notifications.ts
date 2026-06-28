"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useCallback, useEffect, useMemo, useState } from "react";

type PushUserRole = "manager" | "worker";

type UsePushNotificationsOptions = {
  enabled: boolean;
  userRole?: PushUserRole;
  userId?: string;
};

type PushRegistrationState =
  | "unsupported"
  | "missing-key"
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

export function usePushNotifications({
  enabled,
  userRole,
  userId,
}: UsePushNotificationsOptions) {
  const supported = useMemo(() => isPushSupported(), []);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [state, setState] = useState<PushRegistrationState>(() => {
    if (!supported) return "unsupported";
    if (!publicKey) return "missing-key";
    return Notification.permission;
  });

  const subscribe = useCallback(
    async (requestPermission: boolean) => {
      if (!enabled || !userRole || !userId || !supported || !publicKey) return;

      try {
        const permission =
          Notification.permission === "default" && requestPermission
            ? await Notification.requestPermission()
            : Notification.permission;

        setState(permission);
        if (permission !== "granted") return;

        setState("subscribing");

        const registration = await navigator.serviceWorker.register("/sw.js");
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

        setState("subscribed");
      } catch (error) {
        setState("failed");
        console.warn("[Slang] Push registration failed", error);
      }
    },
    [enabled, publicKey, supported, userId, userRole]
  );

  useEffect(() => {
    if (!enabled || !supported || !publicKey) return;

    if (Notification.permission === "granted") {
      const timeout = window.setTimeout(() => {
        void subscribe(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [enabled, publicKey, subscribe, supported]);

  return {
    state,
    requestPermissionAndSubscribe: () => subscribe(true),
  };
}

