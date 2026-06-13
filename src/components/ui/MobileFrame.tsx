import { AppShell } from "@/components/ui/AppShell";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type MobileFrameProps = {
  children: ReactNode;
  dir?: "ltr" | "rtl";
  className?: string;
};

export function MobileFrame({
  children,
  dir = "ltr",
  className,
}: MobileFrameProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center bg-[var(--jobchat-surface)]">
      <AppShell dir={dir} className={cn("min-h-0 flex-1 shadow-xl", className)}>
        {children}
      </AppShell>
    </div>
  );
}
