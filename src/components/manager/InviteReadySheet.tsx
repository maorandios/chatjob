"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TopPillNotice } from "@/components/ui/TopPillNotice";
import { useToast } from "@/components/ui/Toast";
import { Check, Copy, MessageCircleCheck } from "lucide-react";
import { useState } from "react";

type InviteReadySheetProps = {
  open: boolean;
  onClose: () => void;
  memberName: string;
  inviteUrl: string;
  kind?: "manager" | "worker";
  whatsappText?: string;
  title?: string;
  subtitle?: string;
  showCelebration?: boolean;
};

export function InviteReadySheet({
  open,
  onClose,
  memberName,
  inviteUrl,
  whatsappText,
  title = "ההזמנה נוצרה!",
  subtitle = "שלחו את קישור ההזמנה בוואטספ או העתיקו אותו",
  showCelebration = true,
}: InviteReadySheetProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copyNoticeKey, setCopyNoticeKey] = useState(0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setCopyNoticeKey((key) => key + 1);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("לא ניתן להעתיק");
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      whatsappText ?? `${memberName}, הוזמנת ל-Slang: ${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {copyNoticeKey > 0 && (
        <TopPillNotice
          key={copyNoticeKey}
          text="הקישור הועתק"
          onDone={() => {}}
        />
      )}
      <Sheet open={open} onClose={onClose} dir="rtl" showCloseButton={false}>
        <div className="flex flex-col items-center text-center">
          {showCelebration && (
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)] animate-in zoom-in duration-300">
              <Check className="h-8 w-8 text-[var(--jobchat-accent)]" />
            </div>
          )}
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>

          <div className="mt-6 w-full rounded-xl bg-[var(--jobchat-surface)] p-4">
            <p className="break-all text-sm text-gray-700" dir="ltr">
              {inviteUrl}
            </p>
          </div>

          <div className="mt-4 flex w-full gap-3">
            <Button fullWidth onClick={handleWhatsApp} className="gap-2">
              <MessageCircleCheck className="h-4 w-4 shrink-0" />
              שלח וואטספ
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <Copy className="h-4 w-4 shrink-0" />
              )}
              העתק
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
