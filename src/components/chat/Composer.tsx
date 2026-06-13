"use client";

import { ImageAttachSheet } from "@/components/chat/ImageAttachSheet";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { Portal } from "@/components/ui/Portal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

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
};

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
}: ComposerProps) {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hasText = text.trim().length > 0;

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        "--composer-height",
        `${bar.offsetHeight}px`
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [hasText]);

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

  return (
    <>
      <Portal>
        <div
          ref={barRef}
          className="composer-bar fixed inset-x-0 z-[40] border-t border-[var(--jobchat-border)] bg-white"
        >
          <div className="mx-auto w-full max-w-[430px] px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2.5">
            <div dir="ltr" className="flex items-end gap-2">
              <div
                dir={dir}
                className="flex min-h-[48px] min-w-0 flex-1 items-end rounded-[26px] border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)] px-4 py-3 transition-colors focus-within:border-[var(--jobchat-accent)]/40 focus-within:bg-white"
              >
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
                  autoComplete="off"
                  autoCorrect="on"
                  className={cn(
                    "max-h-[120px] w-full min-w-0 flex-1 resize-none bg-transparent text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60",
                    large
                      ? "text-[17px] leading-relaxed"
                      : "text-[16px] leading-normal"
                  )}
                />
              </div>

              {!hasText && onImageSend && (
                <button
                  type="button"
                  disabled={disabled || isSending}
                  onClick={() => setShowImageSheet(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)] text-gray-500 active:bg-gray-100 disabled:opacity-40"
                  aria-label={attachImageTitle}
                >
                  <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
                </button>
              )}

              {hasText ? (
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={disabled || isSending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-white shadow-[0_2px_10px_rgba(0,60,255,0.35)] active:opacity-90 disabled:opacity-40"
                  aria-label="Send"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              ) : onVoiceSend ? (
                <div className="shrink-0">
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
                </div>
              ) : (
                <div className="h-11 w-11 shrink-0" />
              )}
            </div>
          </div>
        </div>
      </Portal>

      {onImageSend && (
        <ImageAttachSheet
          open={showImageSheet}
          title={attachImageTitle}
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
