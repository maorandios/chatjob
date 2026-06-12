"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { getInviteUrl } from "@/lib/utils";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

type InviteReadySheetProps = {
  open: boolean;
  onClose: () => void;
  workerName: string;
  inviteToken: string;
};

export function InviteReadySheet({
  open,
  onClose,
  workerName,
  inviteToken,
}: InviteReadySheetProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const inviteUrl = getInviteUrl(inviteToken);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showToast("הקישור הועתק");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("לא ניתן להעתיק");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "JobChat",
      text: `${workerName} הוזמן ל-JobChat`,
      url: inviteUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/15 animate-in zoom-in duration-300">
          <Check className="h-8 w-8 text-[#25D366]" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">ההזמנה נוצרה!</h2>
        <p className="mt-2 text-sm text-gray-500">
          שלח ל{workerName} בוואטסאפ או SMS
        </p>

        <div className="mt-6 w-full rounded-xl bg-gray-50 p-4">
          <p className="break-all text-sm text-gray-700" dir="ltr">
            {inviteUrl}
          </p>
        </div>

        <div className="mt-4 flex w-full gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            העתק
          </Button>
          <Button fullWidth onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            שתף
          </Button>
        </div>

        <Button variant="ghost" fullWidth onClick={onClose} className="mt-3">
          סיום
        </Button>
      </div>
    </Sheet>
  );
}
