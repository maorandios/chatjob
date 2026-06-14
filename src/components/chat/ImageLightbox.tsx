"use client";

import { Portal } from "@/components/ui/Portal";
import { addModalBackdrop, removeModalBackdrop } from "@/lib/modal-backdrop";
import { X } from "lucide-react";
import { useEffect } from "react";

type ImageLightboxProps = {
  open: boolean;
  src: string;
  onClose: () => void;
};

export function ImageLightbox({ open, src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    addModalBackdrop();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      removeModalBackdrop();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/92 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute end-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
          aria-label="Close"
        >
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="max-h-[calc(100dvh-2rem)] max-w-full object-contain"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </Portal>
  );
}
