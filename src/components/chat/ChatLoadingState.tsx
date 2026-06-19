"use client";

import { cn } from "@/lib/utils";

type ChatLoadingStateProps = {
  className?: string;
};

export function ChatLoadingState({
  className,
}: ChatLoadingStateProps) {
  return (
    <div className={cn("w-full space-y-4 px-4", className)} aria-hidden>
      <div className="ms-auto h-12 w-2/3 animate-pulse rounded-3xl rounded-br-md bg-white/60" />
      <div className="h-16 w-4/5 animate-pulse rounded-3xl rounded-bl-md bg-white/70" />
      <div className="ms-auto h-20 w-3/4 animate-pulse rounded-3xl rounded-br-md bg-white/60" />
      <div className="h-12 w-1/2 animate-pulse rounded-3xl rounded-bl-md bg-white/70" />
    </div>
  );
}
