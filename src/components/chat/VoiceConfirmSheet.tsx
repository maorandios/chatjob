"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Loader2, Mic } from "lucide-react";
import { useEffect, useState } from "react";

type VoiceConfirmSheetProps = {
  open: boolean;
  transcript: string;
  title: string;
  youSaidLabel: string;
  editHintLabel?: string;
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
  editHintLabel = "ניתן לערוך אם משהו לא מדויק",
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
    <Sheet open={open} onClose={onRerecord} title={title}>
      <div dir={dir} className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Mic className="h-4 w-4" />
            <span>{youSaidLabel}</span>
          </div>
          <textarea
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            rows={3}
            disabled={isSending}
            dir="auto"
            className="w-full resize-none rounded-xl border border-gray-200 bg-[#ECE5DD] px-4 py-3 text-start text-base leading-relaxed text-gray-900 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 disabled:opacity-60"
          />
          <p className="mt-1.5 text-xs text-gray-400">{editHintLabel}</p>
        </div>
        <Button fullWidth onClick={handleSend} disabled={!edited.trim() || isSending}>
          {isSending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {sendLabel}
            </span>
          ) : (
            sendLabel
          )}
        </Button>
        <Button variant="outline" fullWidth onClick={onRerecord} disabled={isSending}>
          {rerecordLabel}
        </Button>
      </div>
    </Sheet>
  );
}
