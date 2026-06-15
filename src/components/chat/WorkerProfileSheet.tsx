"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { TopPillNotice } from "@/components/ui/TopPillNotice";
import { useToast } from "@/components/ui/Toast";
import { cn, isValidIsraeliPhone } from "@/lib/utils";
import { Copy, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

export type WorkerProfileSave = {
  name: string;
  phone: string;
  employeeNumber: string;
  address: string;
};

type WorkerProfileSheetProps = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  displayPhone: string;
  copyPhone: string;
  employeeNumber?: string;
  address?: string;
  onSave: (data: WorkerProfileSave) => void | Promise<void>;
  phoneCopiedLabel: string;
  dir?: "ltr" | "rtl";
};

function displayValue(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "לא הוזן";
}

function ProfileField({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[13px] text-gray-400">{label}</span>
      <span
        className={cn(
          "max-w-full truncate text-[15px]",
          muted ? "text-gray-400" : "font-medium text-gray-800"
        )}
        dir="auto"
      >
        {value}
      </span>
    </div>
  );
}

function ProfileHero({
  displayName,
  displayPhone,
  onCopyPhone,
  phoneCopiedLabel,
  dir,
}: {
  displayName: string;
  displayPhone: string;
  onCopyPhone: () => void;
  phoneCopiedLabel: string;
  dir: "ltr" | "rtl";
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full p-1 ring-4 ring-[var(--jobchat-accent-light)]">
        <Avatar name={displayName} size="xl" />
      </div>
      <p className="mt-5 text-[22px] font-semibold tracking-tight text-gray-900">
        {displayName}
      </p>
      <button
        type="button"
        onClick={onCopyPhone}
        className="mt-2 inline-flex touch-manipulation items-center gap-1.5 text-[15px] text-gray-500 active:opacity-60"
        aria-label={phoneCopiedLabel}
      >
        <span dir={dir}>{displayPhone}</span>
        <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>
    </div>
  );
}

export function WorkerProfileSheet({
  open,
  onClose,
  displayName,
  displayPhone,
  copyPhone,
  employeeNumber,
  address,
  onSave,
  phoneCopiedLabel,
  dir = "rtl",
}: WorkerProfileSheetProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(displayPhone);
  const [employeeNumberDraft, setEmployeeNumberDraft] = useState(
    employeeNumber ?? ""
  );
  const [addressDraft, setAddressDraft] = useState(address ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [copyNoticeKey, setCopyNoticeKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName(displayName);
    setPhone(displayPhone);
    setEmployeeNumberDraft(employeeNumber ?? "");
    setAddressDraft(address ?? "");
    setErrors({});
  };

  useEffect(() => {
    if (!open) return;
    setEditing(false);
    resetForm();
  }, [open, displayName, displayPhone, employeeNumber, address]);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(copyPhone);
      setCopyNoticeKey((key) => key + 1);
    } catch {
      showToast("לא ניתן להעתיק");
    }
  };

  const handleStartEdit = () => {
    resetForm();
    setEditing(true);
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async () => {
    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם";
    if (!isValidIsraeliPhone(phone)) {
      nextErrors.phone = "נא להזין מספר טלפון תקין (9-10 ספרות)";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        employeeNumber: employeeNumberDraft.trim(),
        address: addressDraft.trim(),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const employeeDisplay = displayValue(employeeNumber);
  const addressDisplay = displayValue(address);

  return (
    <>
      {copyNoticeKey > 0 && (
        <TopPillNotice key={copyNoticeKey} text={phoneCopiedLabel} />
      )}
      <Sheet open={open} onClose={onClose} dir={dir} showCloseButton={false}>
        <div dir={dir} className="space-y-8 pb-1">
          {!editing ? (
            <>
              <div className="space-y-6">
                <ProfileHero
                  displayName={displayName}
                  displayPhone={displayPhone}
                  onCopyPhone={handleCopyPhone}
                  phoneCopiedLabel={phoneCopiedLabel}
                  dir={dir}
                />

                <div className="flex flex-col items-center gap-5">
                  <ProfileField
                    label="מספר עובד"
                    value={employeeDisplay}
                    muted={!employeeNumber?.trim()}
                  />
                  <ProfileField
                    label="כתובת"
                    value={addressDisplay}
                    muted={!address?.trim()}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartEdit}
                className="flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[var(--jobchat-accent)] text-[15px] font-semibold text-white active:scale-[0.98] active:opacity-90"
              >
                <Pencil className="h-4 w-4" />
                עריכת נתונים
              </button>
            </>
          ) : (
            <>
              <ProfileHero
                displayName={displayName}
                displayPhone={displayPhone}
                onCopyPhone={handleCopyPhone}
                phoneCopiedLabel={phoneCopiedLabel}
                dir={dir}
              />

              <div className="space-y-3">
                <Input
                  dir={dir}
                  label="שם מלא"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
                <Input
                  dir={dir}
                  label="מספר טלפון"
                  placeholder="מספר טלפון"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <Input
                  dir={dir}
                  label="מספר עובד"
                  placeholder="מספר עובד"
                  value={employeeNumberDraft}
                  onChange={(e) => setEmployeeNumberDraft(e.target.value)}
                />
                <Input
                  dir={dir}
                  label="כתובת"
                  placeholder="כתובת"
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="!rounded-2xl text-gray-600"
                >
                  ביטול
                </Button>
                <Button
                  fullWidth
                  onClick={handleSave}
                  disabled={saving}
                  className="!rounded-2xl"
                >
                  שמור
                </Button>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
