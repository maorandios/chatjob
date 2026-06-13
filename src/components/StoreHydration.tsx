"use client";

import { useJobChatStore } from "@/lib/mock/store";
import { useEffect, type ReactNode } from "react";

const HYDRATION_TIMEOUT_MS = 3000;

export function StoreHydration({ children }: { children: ReactNode }) {
  const hydrated = useJobChatStore((s) => s.hydrated);

  useEffect(() => {
    let finished = false;

    const finishHydration = () => {
      if (finished) return;
      finished = true;
      useJobChatStore.getState().setHydrated(true);
    };

    const timeoutId = window.setTimeout(finishHydration, HYDRATION_TIMEOUT_MS);

    void Promise.resolve(useJobChatStore.persist.rehydrate())
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timeoutId);
        finishHydration();
      });

    return () => {
      finished = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--jobchat-surface)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--jobchat-accent)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
