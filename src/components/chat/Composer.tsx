"use client";

import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

type ComposerProps = {
  onSend: (text: string) => Promise<void>;
  onVoiceSend?: (blob: Blob) => Promise<void>;
  placeholder?: string;
  processingLabel?: string;
  recordingLabel?: string;
  micErrorLabel?: string;
  tooShortLabel?: string;
  large?: boolean;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
};

export function Composer({
  onSend,
  onVoiceSend,
  placeholder = "הודעה",
  processingLabel = "שולח...",
  recordingLabel = "מקליט...",
  micErrorLabel = "לא ניתן לגשת למיקרופון",
  tooShortLabel = "הקלטה קצרה מדי — החזק עוד קצת",
  large = false,
  dir = "rtl",
  disabled = false,
}: ComposerProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  return (
    <div
      dir={dir}
      className="flex items-end gap-2 border-t border-gray-200 bg-[#F0F2F5] px-3 py-2 safe-bottom"
    >
      {onVoiceSend ? (
        <VoiceRecorder
          onRecorded={onVoiceSend}
          disabled={disabled || isSending}
          processingLabel={processingLabel}
          recordingLabel={recordingLabel}
          errorLabel={micErrorLabel}
          tooShortLabel={tooShortLabel}
          dir={dir}
        />
      ) : (
        <div className="mb-1 h-11 w-11 shrink-0" />
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
          "max-h-24 min-h-11 flex-1 resize-none rounded-3xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-[#25D366] disabled:opacity-60",
          large ? "text-lg" : "text-base"
        )}
      />
      {isSending ? (
        <div className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#25D366]" />
        </div>
      ) : text.trim() ? (
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={disabled}
          className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#1fb855] disabled:opacity-60"
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      ) : (
        <div className="mb-1 h-11 w-11 shrink-0" />
      )}
    </div>
  );
}
