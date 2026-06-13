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
    <div className="flex min-h-dvh justify-center bg-[var(--jobchat-surface)]">
      <div
        dir={dir}
        className={cn(
          "mobile-shell relative flex w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
