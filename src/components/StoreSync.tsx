"use client";

import { useJobChatStore } from "@/lib/mock/store";
import { useEffect } from "react";

export const STORE_PERSIST_KEY = "jobchat-prototype";
const SYNC_CHANNEL = "jobchat-prototype-sync";

let isRehydrating = false;

async function rehydrateFromStorage() {
  if (isRehydrating || typeof window === "undefined") return;
  isRehydrating = true;
  try {
    await useJobChatStore.persist.rehydrate();
  } finally {
    isRehydrating = false;
  }
}

export function StoreSync() {
  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(SYNC_CHANNEL)
        : null;

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORE_PERSIST_KEY) {
        void rehydrateFromStorage();
      }
    };

    const onBroadcast = () => {
      void rehydrateFromStorage();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void rehydrateFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    channel?.addEventListener("message", onBroadcast);

    const unsubscribe = useJobChatStore.subscribe((state, prevState) => {
      if (
        state.messages !== prevState.messages ||
        state.workers !== prevState.workers ||
        state.contactAliases !== prevState.contactAliases
      ) {
        channel?.postMessage("sync");
      }
    });

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      channel?.removeEventListener("message", onBroadcast);
      channel?.close();
      unsubscribe();
    };
  }, []);

  return null;
}
