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
    <div className="flex min-h-dvh justify-center bg-[#ECE5DD]">
      <div
        dir={dir}
        className={cn(
          "relative flex min-h-dvh w-full max-w-[430px] flex-col bg-white shadow-xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
