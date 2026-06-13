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
  const hasText = Boolean(text.trim());

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
      <div className="sticky bottom-0 z-10 shrink-0 border-t border-[var(--jobchat-border)] bg-white px-4 pt-3.5 safe-bottom">
        <div dir="ltr" className="flex items-center gap-2.5">
          <div
            dir={dir}
            className={cn(
              "flex min-h-[48px] flex-1 items-center rounded-[26px] border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)] transition-colors focus-within:border-[var(--jobchat-accent)]/40 focus-within:bg-white",
              hasText ? "gap-2 pl-2 pr-4 py-2" : "px-4 py-3"
            )}
          >
            {hasText && (
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={disabled || isSending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                aria-label="Send"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            )}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={disabled || isSending}
              placeholder={placeholder}
              className={cn(
                "max-h-[120px] w-full flex-1 resize-none bg-transparent text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60",
                large ? "text-[17px] leading-relaxed" : "text-[15px] leading-normal"
              )}
            />
          </div>

          {onImageSend && (
            <button
              type="button"
              disabled={disabled || isSending}
              onClick={() => setShowImageSheet(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)] text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
              aria-label={attachImageTitle}
            >
              <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
            </button>
          )}

          {onVoiceSend ? (
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
            <div className="h-10 w-10 shrink-0" />
          )}
        </div>
      </div>

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
