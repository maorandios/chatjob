"use client";

import { ImageAttachSheet } from "@/components/chat/ImageAttachSheet";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

type ComposerProps = {
  onSend: (text: string) => Promise<void>;
  onVoiceSend?: (blob: Blob) => Promise<void>;
  onImageSend?: (file: File) => Promise<void>;
  placeholder?: string;
  processingLabel?: string;
  analyzingLabel?: string;
  recordingLabel?: string;
  finishRecordingLabel?: string;
  deleteRecordingLabel?: string;
  maxDurationLabel?: string;
  micErrorLabel?: string;
  tooShortLabel?: string;
  attachImageTitle?: string;
  takePhotoLabel?: string;
  chooseGalleryLabel?: string;
  imageSendFailedLabel?: string;
  large?: boolean;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  variant?: "default" | "telegram";
};

const actionBtn =
  "flex shrink-0 touch-manipulation items-center justify-center rounded-full";

const inlineImageBtn = cn(
  actionBtn,
  "h-9 w-9 border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)] text-gray-500 active:bg-gray-100 disabled:opacity-40"
);

export function Composer({
  onSend,
  onVoiceSend,
  onImageSend,
  placeholder = "כתוב הודעה",
  processingLabel = "שולח...",
  analyzingLabel = "ממיר הקלטה לטקסט",
  recordingLabel = "מקליט...",
  finishRecordingLabel = "סיים",
  deleteRecordingLabel = "מחק",
  maxDurationLabel = "הגעת למקסימום 20 שניות",
  micErrorLabel = "לא ניתן לגשת למיקרופון",
  tooShortLabel = "הקלטה קצרה מדי — החזק עוד קצת",
  attachImageTitle = "שליחת תמונה",
  takePhotoLabel = "צלם תמונה",
  chooseGalleryLabel = "בחר מהגלריה",
  imageSendFailedLabel = "שליחת התמונה נכשלה",
  large = false,
  dir = "rtl",
  disabled = false,
  variant = "default",
}: ComposerProps) {
  const isTelegram = variant === "telegram";
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = text.trim().length > 0;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;
    setIsSending(true);
    try {
      await onSend(trimmed);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelected = async (file: File) => {
    if (!onImageSend || disabled || isSending) return;
    setIsSending(true);
    try {
      await onImageSend(file);
    } catch {
      showToast(imageSendFailedLabel);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const imageButton = onImageSend ? (
    <button
      type="button"
      disabled={disabled || isSending}
      onClick={() => setShowImageSheet(true)}
      className={cn(
        actionBtn,
        isTelegram
          ? "h-9 w-9 text-[var(--tg-theme-link-color,var(--jobchat-accent))] active:opacity-70 disabled:opacity-40"
          : inlineImageBtn
      )}
      aria-label={attachImageTitle}
    >
      <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
    </button>
  ) : null;

  return (
    <>
      <div className={cn("composer-dock", isTelegram && "composer-dock--telegram")}>
        <div dir="ltr" className="flex items-end gap-2">
          <div
            dir={dir}
            className={cn(
              "flex min-h-[44px] min-w-0 flex-1 items-center gap-2 px-1 py-1",
              isTelegram
                ? "rounded-[22px] bg-[var(--tg-theme-secondary-bg-color,var(--jobchat-surface))] px-3"
                : "rounded-[26px] border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)] px-3 py-1.5 focus-within:border-[var(--jobchat-accent)]/40 focus-within:bg-white"
            )}
          >
            {dir === "rtl" && imageButton}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={disabled || isSending}
              placeholder={placeholder}
              enterKeyHint="send"
              className={cn(
                "max-h-[120px] min-h-[24px] min-w-0 flex-1 resize-none bg-transparent py-1 outline-none disabled:opacity-60",
                isTelegram
                  ? "text-[var(--tg-theme-text-color,#111827)] placeholder:text-[var(--tg-theme-hint-color,#9ca3af)]"
                  : "text-gray-900 placeholder:text-gray-400",
                large ? "text-[17px] leading-relaxed" : "text-[16px] leading-normal"
              )}
            />
            {dir === "ltr" && imageButton}
          </div>

          {hasText ? (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={disabled || isSending}
              className={cn(
                actionBtn,
                isTelegram
                  ? "h-10 w-10 text-[var(--tg-theme-link-color,var(--jobchat-accent))] active:opacity-70 disabled:opacity-40"
                  : "h-11 w-11 bg-[var(--jobchat-accent)] text-white shadow-[0_2px_10px_rgba(0,60,255,0.35)] active:opacity-90 disabled:opacity-40"
              )}
              aria-label="Send"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          ) : onVoiceSend ? (
            <VoiceRecorder
              onRecorded={onVoiceSend}
              disabled={disabled || isSending}
              processingLabel={processingLabel}
              analyzingLabel={analyzingLabel}
              recordingLabel={recordingLabel}
              finishRecordingLabel={finishRecordingLabel}
              deleteRecordingLabel={deleteRecordingLabel}
              maxDurationLabel={maxDurationLabel}
              errorLabel={micErrorLabel}
              tooShortLabel={tooShortLabel}
              prominent
              dir={dir}
            />
          ) : (
            <div className="h-11 w-11 shrink-0" />
          )}
        </div>
      </div>

      {onImageSend && (
        <ImageAttachSheet
          open={showImageSheet}
          takePhotoLabel={takePhotoLabel}
          chooseGalleryLabel={chooseGalleryLabel}
          onClose={() => setShowImageSheet(false)}
          onImageSelected={(file) => void handleImageSelected(file)}
          dir={dir}
        />
      )}
    </>
  );
}
