"use client";

import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";

type TopPillNoticeProps = {
  text: string;
  onDone?: () => void;
};

export function TopPillNotice({ text, onDone }: TopPillNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    const hideTimer = window.setTimeout(() => setVisible(false), 2200);
    const doneTimer = window.setTimeout(() => onDone?.(), 2600);

    return () => {
      cancelAnimationFrame(enterFrame);
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <Portal>
      <div
        className={cn("jobchat-top-pill", visible && "jobchat-top-pill--visible")}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          <span>{text}</span>
        </div>
      </div>
    </Portal>
  );
}
