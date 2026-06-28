"use client";

import { MainLoader } from "@/components/ui/MainLoader";
import { cn } from "@/lib/utils";

type ChatLoadingStateProps = {
  className?: string;
};

export function ChatLoadingState({
  className,
}: ChatLoadingStateProps) {
  return (
    <div
      className={cn("flex w-full items-center justify-center px-4", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <MainLoader />
    </div>
  );
}
