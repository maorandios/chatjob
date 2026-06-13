"use client";

import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      return;
    }

    if (dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  if (!open) return null;

  return (
    <Portal>
      <dialog
        ref={dialogRef}
        className="jobchat-sheet"
        onClick={(event) => {
          if (event.target === dialogRef.current) onClose();
        }}
      >
        <div
          className={cn("jobchat-sheet-panel", className)}
          onClick={(event) => event.stopPropagation()}
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
      </dialog>
    </Portal>
  );
}
