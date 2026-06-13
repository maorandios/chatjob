"use client";

import { useJobChatStore } from "@/lib/mock/store";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

function clearPersistedState() {
  try {
    localStorage.removeItem("jobchat-prototype");
  } catch {
    // ignore
  }
}

export function StoreHydration({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const rehydrateId = window.setTimeout(() => {
      void Promise.resolve(useJobChatStore.persist.rehydrate())
        .catch((error) => {
          console.warn("[JobChat] Rehydrate failed", error);
          clearPersistedState();
        })
        .finally(() => {
          useJobChatStore.getState().setHydrated(true);
        });
    }, 0);

    return () => window.clearTimeout(rehydrateId);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--jobchat-surface)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--jobchat-accent)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
