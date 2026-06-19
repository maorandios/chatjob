"use client";

import { MainLoader } from "@/components/ui/MainLoader";

export function AppLoadingState() {
  return (
    <div
      className="flex min-h-0 flex-1 items-center justify-center bg-[var(--jobchat-surface)]"
      aria-busy="true"
      aria-live="polite"
    >
      <MainLoader />
    </div>
  );
}
