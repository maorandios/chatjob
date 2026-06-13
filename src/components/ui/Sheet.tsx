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

function SheetPanel({
  title,
  children,
  className,
  onClose,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn("jobchat-sheet-panel", className)}
    >
      <div className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-gray-200" />
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div className="jobchat-sheet-overlay" role="presentation">
        <button
          type="button"
          className="jobchat-sheet-backdrop"
          onClick={onClose}
          aria-label="Close"
        />
        <SheetPanel title={title} className={className} onClose={onClose}>
          {children}
        </SheetPanel>
      </div>
    </Portal>
  );
}
