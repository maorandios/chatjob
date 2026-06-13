"use client";

import { Portal } from "@/components/ui/Portal";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[300] flex items-end justify-center"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 touch-none bg-black/50"
          onClick={onClose}
          aria-label="Close"
        />
        <div
          className={cn(
            "relative z-10 w-full max-w-[430px] max-h-[min(92dvh,92vh)] touch-auto overflow-y-auto overscroll-contain rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.15)]",
            "pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-gray-200" />
          {title && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </Portal>
  );
}
