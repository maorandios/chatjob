import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  dir?: "ltr" | "rtl";
  className?: string;
  centered?: boolean;
};

/** Mobile-first full-height page shell for PWA. */
export function AppShell({
  children,
  dir = "ltr",
  className,
  centered = true,
}: AppShellProps) {
  return (
    <div className={cn("app-root", centered && "app-root--centered", className)}>
      <div dir={dir} className="flex h-full min-h-0 flex-col">
        {children}
      </div>
    </div>
  );
}
