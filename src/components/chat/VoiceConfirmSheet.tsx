"use client";

import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import { Loader2, Mic, X } from "lucide-react";
import { useEffect, useState } from "react";

type VoiceConfirmSheetProps = {
  open: boolean;
  transcript: string;
  title: string;
  youSaidLabel: string;
  sendLabel: string;
  rerecordLabel: string;
  isSending?: boolean;
  onSend: (editedTranscript: string) => void | Promise<void>;
  onRerecord: () => void;
  dir?: "ltr" | "rtl";
};

export function VoiceConfirmSheet({
  open,
  transcript,
  title,
  youSaidLabel,
  sendLabel,
  rerecordLabel,
  isSending = false,
  onSend,
  onRerecord,
  dir = "rtl",
}: VoiceConfirmSheetProps) {
  const [edited, setEdited] = useState(transcript);

  useEffect(() => {
    if (open) setEdited(transcript);
  }, [open, transcript]);

  const handleSend = () => {
    const trimmed = edited.trim();
    if (!trimmed || isSending) return;
    void onSend(trimmed);
  };

  return (
    <Sheet
      open={open}
      onClose={onRerecord}
      className="rounded-t-[28px] px-6 pb-2 pt-3 safe-bottom"
    >
      <div dir={dir}>
        <div dir="ltr" className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onRerecord}
            disabled={isSending}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[var(--jobchat-surface)] disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">
            {title}
          </h2>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-gray-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
              <Mic className="h-3.5 w-3.5 text-[var(--jobchat-accent)]" />
            </span>
            <span>{youSaidLabel}</span>
          </div>
          <textarea
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            rows={3}
            disabled={isSending}
            dir="auto"
            className="w-full resize-none rounded-[20px] border-0 bg-[var(--jobchat-surface)] px-4 py-3.5 text-start text-[16px] leading-relaxed text-gray-900 outline-none ring-1 ring-[var(--jobchat-border)] transition-shadow focus:ring-2 focus:ring-[var(--jobchat-accent)]/25 disabled:opacity-60"
          />
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleSend}
            disabled={!edited.trim() || isSending}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--jobchat-accent)] px-3 text-[14px] font-semibold text-white transition-all",
              "hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
            )}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span className="truncate">{sendLabel}</span>
              </>
            ) : (
              <span className="truncate">{sendLabel}</span>
            )}
          </button>
          <button
            type="button"
            onClick={onRerecord}
            disabled={isSending}
            className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-full bg-[var(--jobchat-surface)] px-3 text-[14px] font-medium text-gray-700 ring-1 ring-[var(--jobchat-border)] transition-all hover:bg-gray-100 active:scale-[0.98] disabled:opacity-40"
          >
            <span className="truncate">{rerecordLabel}</span>
          </button>
        </div>
      </div>
    </Sheet>
  );
}
