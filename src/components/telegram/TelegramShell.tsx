"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TelegramShellProps = {
  children: ReactNode;
  dir?: "ltr" | "rtl";
  className?: string;
};

/** Full-viewport shell for Telegram Mini App — no centered phone frame. */
export function TelegramShell({
  children,
  dir = "rtl",
  className,
}: TelegramShellProps) {
  return (
    <div
      dir={dir}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        className
      )}
      style={{
        backgroundColor: "var(--tg-theme-bg-color, var(--jobchat-surface))",
        color: "var(--tg-theme-text-color, var(--foreground))",
      }}
    >
      {children}
    </div>
  );
}
