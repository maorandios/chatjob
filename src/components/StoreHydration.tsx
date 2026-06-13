"use client";

import { useJobChatStore } from "@/lib/mock/store";
import { useEffect, type ReactNode } from "react";

export function StoreHydration({ children }: { children: ReactNode }) {
  const hydrated = useJobChatStore((s) => s.hydrated);

  useEffect(() => {
    void useJobChatStore.persist.rehydrate();
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
