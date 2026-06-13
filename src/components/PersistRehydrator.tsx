"use client";

import { useEffect } from "react";

function clearPersistedState() {
  try {
    localStorage.removeItem("jobchat-prototype");
  } catch {
    // ignore
  }
}

/** Loads saved state after first paint — never blocks the UI. */
export function PersistRehydrator() {
  useEffect(() => {
    void import("@/lib/mock/store").then(({ useJobChatStore }) => {
      void Promise.resolve(useJobChatStore.persist.rehydrate())
        .catch((error) => {
          console.warn("[JobChat] Rehydrate failed", error);
          clearPersistedState();
        })
        .finally(() => {
          useJobChatStore.getState().setHydrated(true);
        });
    });
  }, []);

  return null;
}
