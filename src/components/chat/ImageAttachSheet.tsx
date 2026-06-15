"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Camera, ImageIcon } from "lucide-react";
import { useRef } from "react";

type ImageAttachSheetProps = {
  open: boolean;
  takePhotoLabel: string;
  chooseGalleryLabel: string;
  onClose: () => void;
  onImageSelected: (file: File) => void;
  dir?: "ltr" | "rtl";
};

export function ImageAttachSheet({
  open,
  takePhotoLabel,
  chooseGalleryLabel,
  onClose,
  onImageSelected,
  dir = "rtl",
}: ImageAttachSheetProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    onImageSelected(file);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      showCloseButton={false}
      className="rounded-t-[28px] px-6 pb-2 pt-3"
    >
      <div dir={dir} className="space-y-2 pb-2">
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[var(--jobchat-accent)] text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
        >
          <Camera className="h-5 w-5" />
          {takePhotoLabel}
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[var(--jobchat-surface)] text-[15px] font-medium text-gray-800 ring-1 ring-[var(--jobchat-border)] transition-all hover:bg-gray-100 active:scale-[0.98]"
        >
          <ImageIcon className="h-5 w-5 text-gray-600" />
          {chooseGalleryLabel}
        </button>
      </div>
    </Sheet>
  );
}
