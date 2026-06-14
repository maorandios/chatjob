"use client";

import { Portal } from "@/components/ui/Portal";
import { addModalBackdrop, removeModalBackdrop } from "@/lib/modal-backdrop";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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
  onTransitionEnd,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  onClose: () => void;
  onTransitionEnd: (event: React.TransitionEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onTransitionEnd={onTransitionEnd}
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
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    addModalBackdrop();
    return () => removeModalBackdrop();
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePanelTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>
  ) => {
    if (event.propertyName !== "transform") return;
    if (!visible && !open) {
      setMounted(false);
    }
  };

  if (!mounted) return null;

  return (
    <Portal>
      <div
        className={cn(
          "jobchat-sheet-overlay",
          visible && "jobchat-sheet-overlay--open"
        )}
        role="presentation"
      >
        <button
          type="button"
          className="jobchat-sheet-backdrop"
          onClick={onClose}
          aria-label="Close"
        />
        <SheetPanel
          title={title}
          className={className}
          onClose={onClose}
          onTransitionEnd={handlePanelTransitionEnd}
        >
          {children}
        </SheetPanel>
      </div>
    </Portal>
  );
}
