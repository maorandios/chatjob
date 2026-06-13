"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  dir?: "ltr" | "rtl";
  className?: string;
  centered?: boolean;
};

/** Standard mobile/PWA page shell: full-height column with safe areas. */
export function AppShell({
  children,
  dir = "ltr",
  className,
  centered = true,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex h-dvh flex-col bg-white",
        centered && "mx-auto w-full max-w-[430px]"
      )}
    >
      <div
        dir={dir}
        className={cn("flex min-h-0 flex-1 flex-col", className)}
      >
        {children}
      </div>
    </div>
  );
}
