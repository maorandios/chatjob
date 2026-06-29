"use client";

import { ImageAttachSheet } from "@/components/chat/ImageAttachSheet";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { useToast } from "@/components/ui/Toast";
import { markLocationPermissionReady } from "@/lib/location-permission";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Send } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

type ComposerProps = {
  onSend: (text: string) => Promise<void>;
  onVoiceSend?: (blob: Blob) => Promise<void>;
  onImageSend?: (file: File) => Promise<void>;
  onLocationSend?: (location: {
    latitude: number;
    longitude: number;
    label?: string;
  }) => Promise<void>;
  placeholder?: string;
  processingLabel?: string;
  analyzingLabel?: string;
  recordingLabel?: string;
  readyLabel?: string;
  finishRecordingLabel?: string;
  deleteRecordingLabel?: string;
  maxDurationLabel?: string;
  micErrorLabel?: string;
  tooShortLabel?: string;
  attachImageTitle?: string;
  takePhotoLabel?: string;
  chooseGalleryLabel?: string;
  shareLocationLabel?: string;
  imageSendFailedLabel?: string;
  locationSendFailedLabel?: string;
  locationUnsupportedLabel?: string;
  locationPermissionDeniedLabel?: string;
  locationSecureContextLabel?: string;
  locationUnavailableLabel?: string;
  locationTimeoutLabel?: string;
  large?: boolean;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
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
  onLocationSend,
  placeholder = "כתוב הודעה",
  processingLabel = "שולח...",
  analyzingLabel = "ממיר הקלטה לטקסט",
  recordingLabel = "מקליט...",
  readyLabel = "הקלטה מוכנה",
  finishRecordingLabel = "סיים",
  deleteRecordingLabel = "מחק",
  maxDurationLabel = "הגעת למקסימום 20 שניות",
  micErrorLabel = "לא ניתן לגשת למיקרופון",
  tooShortLabel = "הקלטה קצרה מדי — החזק עוד קצת",
  attachImageTitle = "שליחת תמונה",
  takePhotoLabel = "צלם תמונה",
  chooseGalleryLabel = "בחר מהגלריה",
  shareLocationLabel = "שתף מיקום",
  imageSendFailedLabel = "שליחת התמונה נכשלה",
  locationSendFailedLabel = "שליחת המיקום נכשלה",
  locationUnsupportedLabel = "המכשיר לא תומך בשיתוף מיקום",
  locationPermissionDeniedLabel = "צריך לאשר גישה למיקום בהגדרות הדפדפן או האייפון",
  locationSecureContextLabel = "שיתוף מיקום דורש חיבור מאובטח (HTTPS) או אפליקציה מותקנת",
  locationUnavailableLabel = "לא הצלחנו למצוא את המיקום. ודאו ששירותי המיקום פעילים",
  locationTimeoutLabel = "איתור המיקום לקח יותר מדי זמן. נסו שוב",
  large = false,
  dir = "rtl",
  disabled = false,
}: ComposerProps) {
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

  const getCurrentLocation = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 15_000,
      });
    });

  const handleLocationSelected = async () => {
    if (!onLocationSend || disabled || isSending) return;
    if (typeof window !== "undefined" && !window.isSecureContext) {
      showToast(locationSecureContextLabel);
      return;
    }
    if (!("geolocation" in navigator)) {
      showToast(locationUnsupportedLabel);
      return;
    }

    setIsSending(true);
    try {
      const position = await getCurrentLocation();
      markLocationPermissionReady();
      await onLocationSend({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: "מיקום",
      });
    } catch (error) {
      const geoError =
        typeof error === "object" && error !== null && "code" in error
          ? (error as GeolocationPositionError)
          : null;
      const message =
        error instanceof Error && error.message !== "Failed to send location"
          ? error.message
          : locationSendFailedLabel;
      if (geoError?.code === 1) {
        showToast(locationPermissionDeniedLabel);
      } else if (geoError?.code === 2) {
        showToast(locationUnavailableLabel);
      } else if (geoError?.code === 3) {
        showToast(locationTimeoutLabel);
      } else {
        showToast(message);
      }
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

  const attachmentButton = onImageSend || onLocationSend ? (
    <button
      type="button"
      disabled={disabled || isSending}
      onClick={() => setShowImageSheet(true)}
      className={inlineImageBtn}
      aria-label={attachImageTitle}
    >
      <Plus className="h-5 w-5" strokeWidth={1.9} />
    </button>
  ) : null;

  return (
    <>
      <div className="composer-dock">
        <div dir="ltr" className="flex items-end gap-2">
          <div
            dir={dir}
            className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2 rounded-[26px] border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)] px-3 py-1.5 focus-within:border-[var(--jobchat-accent)]/40 focus-within:bg-white"
          >
            {dir === "rtl" && attachmentButton}
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
                "max-h-[120px] min-h-[24px] min-w-0 flex-1 resize-none bg-transparent py-1 text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60",
                large ? "text-[17px] leading-relaxed" : "text-[16px] leading-normal"
              )}
            />
            {dir === "ltr" && attachmentButton}
          </div>

          {hasText ? (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={disabled || isSending}
              className={cn(
                actionBtn,
                "h-11 w-11 bg-[var(--jobchat-accent)] text-white shadow-[0_2px_10px_rgba(0,60,255,0.35)] active:opacity-90 disabled:opacity-40"
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
              readyLabel={readyLabel}
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

      {(onImageSend || onLocationSend) && (
        <ImageAttachSheet
          open={showImageSheet}
          takePhotoLabel={takePhotoLabel}
          chooseGalleryLabel={chooseGalleryLabel}
          shareLocationLabel={shareLocationLabel}
          onClose={() => setShowImageSheet(false)}
          onImageSelected={(file) => void handleImageSelected(file)}
          onLocationSelected={
            onLocationSend ? () => void handleLocationSelected() : undefined
          }
          dir={dir}
        />
      )}
    </>
  );
}
