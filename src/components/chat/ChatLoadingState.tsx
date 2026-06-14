"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ChatLoadingStateProps = {
  label?: string;
  className?: string;
};

export function ChatLoadingState({
  label = "טוען שיחה",
  className,
}: ChatLoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-[var(--jobchat-accent)]" />
      <p className="mt-3 text-sm text-gray-500">{label}</p>
    </div>
  );
}
