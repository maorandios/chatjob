"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { TopPillNotice } from "@/components/ui/TopPillNotice";
import { useToast } from "@/components/ui/Toast";
import { isValidIsraeliPhone } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";

export type ContactProfileSave = {
  name: string;
  phone: string;
};

type ContactNameSheetProps = {
  open: boolean;
  onClose: () => void;
  originalPhone: string;
  displayName: string;
  displayPhone: string;
  email?: string;
  onSave: (data: ContactProfileSave) => void | Promise<void>;
  namePlaceholder: string;
  phonePlaceholder: string;
  saveLabel: string;
  phoneCopiedLabel: string;
  dir?: "ltr" | "rtl";
};

export function ContactNameSheet({
  open,
  onClose,
  originalPhone,
  displayName,
  displayPhone,
  email,
  onSave,
  namePlaceholder,
  phonePlaceholder,
  saveLabel,
  phoneCopiedLabel,
  dir = "rtl",
}: ContactNameSheetProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(displayPhone);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [copyNoticeKey, setCopyNoticeKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(displayName);
    setPhone(displayPhone);
    setErrors({});
  }, [open, displayName, displayPhone]);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(originalPhone);
      setCopyNoticeKey((key) => key + 1);
    } catch {
      showToast("לא ניתן להעתיק");
    }
  };

  const handleSave = async () => {
    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם";
    if (phone.trim() && !isValidIsraeliPhone(phone)) {
      nextErrors.phone = "נא להזין מספר טלפון תקין (9-10 ספרות)";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({ name: name.trim(), phone: phone.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {copyNoticeKey > 0 && (
        <TopPillNotice key={copyNoticeKey} text={phoneCopiedLabel} />
      )}
      <Sheet
        open={open}
        onClose={onClose}
        dir={dir}
        showCloseButton={false}
      >
        <div dir={dir} className="space-y-5">
          <div className="rounded-xl bg-[var(--jobchat-surface)] px-4 py-6">
            <div className="flex flex-col items-center text-center">
              <Avatar name={displayName} size="xl" />
              <p className="mt-4 text-lg font-semibold text-gray-900">
                {displayName}
              </p>
              {email && (
                <p className="mt-1 text-xs text-gray-400" dir="ltr">
                  {email}
                </p>
              )}
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <p className="text-sm text-gray-600" dir={dir}>
                  {displayPhone}
                </p>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-full text-gray-500 active:bg-gray-200/80"
                  aria-label={phoneCopiedLabel}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <Input
            dir={dir}
            label={namePlaceholder}
            placeholder={namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            dir={dir}
            label={phonePlaceholder}
            placeholder={phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            inputMode="tel"
            autoComplete="tel"
          />

          <Button fullWidth onClick={handleSave} disabled={saving}>
            {saveLabel}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
