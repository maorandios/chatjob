"use client";

import { Portal } from "@/components/ui/Portal";
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center overscroll-none"
        role="presentation"
      >
        <div
          className="absolute inset-0 bg-black/45 animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden
        />
        <div
          className={cn(
            "relative z-10 w-full max-w-[430px] max-h-[min(90dvh,90vh)] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] safe-bottom animate-in fade-in duration-200",
            className
          )}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-gray-200" />
          {title && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-100"
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
