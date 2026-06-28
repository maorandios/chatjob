"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useEffect } from "react";

type PushUserRole = "manager" | "worker";

type UsePushNotificationsOptions = {
  enabled: boolean;
  userRole?: PushUserRole;
  userId?: string;
};

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
  useEffect(() => {
    if (!enabled || !userRole || !userId) return;
    if (!isPushSupported()) return;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;
    const applicationServerKey = urlBase64ToArrayBuffer(publicKey);

    let cancelled = false;

    async function registerPush() {
      try {
        const permission =
          Notification.permission === "default"
            ? await Notification.requestPermission()
            : Notification.permission;

        if (cancelled || permission !== "granted") return;

        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        const subscription =
          existing ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }));

        if (cancelled) return;

        await fetch("/api/push-subscriptions", {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            userRole,
            userId,
            subscription: subscription.toJSON(),
          }),
        });
      } catch (error) {
        console.warn("[Slang] Push registration failed", error);
      }
    }

    void registerPush();

    return () => {
      cancelled = true;
    };
  }, [enabled, userRole, userId]);
}

