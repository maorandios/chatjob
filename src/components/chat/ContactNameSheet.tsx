"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import { isValidIsraeliPhone } from "@/lib/utils";
import { FileText, Mail, Pencil, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export type ContactProfileSave = {
  name: string;
  phone?: string;
  privateNote?: string;
};

type ContactNameSheetProps = {
  open: boolean;
  onClose: () => void;
  originalPhone: string;
  displayName: string;
  displayPhone: string;
  email?: string;
  imageUrl?: string;
  privateNote?: string;
  onSave: (data: ContactProfileSave) => void | Promise<void>;
  namePlaceholder: string;
  phonePlaceholder: string;
  saveLabel: string;
  phoneCopiedLabel: string;
  noteLabel?: string;
  notePlaceholder?: string;
  editablePhone?: boolean;
  editableNote?: boolean;
  dir?: "ltr" | "rtl";
};

function displayValue(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "לא הוזן";
}

function ProfileInfoRow({
  icon: Icon,
  label,
  value,
  muted,
  dir,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  muted?: boolean;
  dir: "ltr" | "rtl";
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl bg-white/55 px-3 py-2.5 text-start">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)]">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p
          className={cn(
            "mt-0.5 truncate text-sm",
            muted ? "text-gray-400" : "font-semibold text-gray-900"
          )}
          dir={dir}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function ContactNameSheet({
  open,
  onClose,
  displayName,
  displayPhone,
  email,
  imageUrl,
  privateNote,
  onSave,
  namePlaceholder,
  phonePlaceholder,
  saveLabel,
  noteLabel = "תיאור קצר",
  notePlaceholder = "הערה פרטית לצוות",
  editablePhone = true,
  editableNote = false,
  dir = "rtl",
}: ContactNameSheetProps) {
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(displayPhone);
  const [note, setNote] = useState(privateNote ?? "");
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(displayName);
    setPhone(displayPhone);
    setNote(privateNote ?? "");
    setEditing(false);
    setErrors({});
  }, [open, displayName, displayPhone, privateNote]);

  const handleSave = async () => {
    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם";
    if (editablePhone && phone.trim() && !isValidIsraeliPhone(phone)) {
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
        phone: editablePhone ? phone.trim() : undefined,
        privateNote: editableNote ? note.trim() : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} dir={dir} showCloseButton={false}>
      <div dir={dir} className="space-y-5">
        <div className="relative rounded-3xl bg-[var(--jobchat-surface)] px-4 py-5">
          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className={cn(
              "absolute top-4 flex h-9 w-9 touch-manipulation items-center justify-center rounded-full bg-white text-gray-500 shadow-[0_6px_18px_rgba(15,23,42,0.08)] active:scale-[0.97]",
              dir === "rtl" ? "left-4" : "right-4"
            )}
            aria-label="עריכה"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.8} />
          </button>

          <div className="flex flex-col items-center text-center">
            <Avatar name={displayName} size="xl" imageUrl={imageUrl} />
            <p className="mt-4 text-lg font-semibold text-gray-900" dir={dir}>
              {displayName}
            </p>
          </div>

          <div className="mt-5 space-y-2.5">
            <ProfileInfoRow
              icon={UserRound}
              label={namePlaceholder}
              value={displayValue(displayName)}
              dir={dir}
            />
            <ProfileInfoRow
              icon={Mail}
              label="אימייל"
              value={displayValue(email)}
              muted={!email?.trim()}
              dir={dir}
            />
            <ProfileInfoRow
              icon={Phone}
              label={phonePlaceholder}
              value={displayValue(displayPhone)}
              muted={!displayPhone.trim()}
              dir={dir}
            />
            {editableNote && (
              <ProfileInfoRow
                icon={FileText}
                label={noteLabel}
                value={displayValue(privateNote)}
                muted={!privateNote?.trim()}
                dir={dir}
              />
            )}
          </div>
        </div>

        {editing && (
          <>
            <Input
              dir={dir}
              label={namePlaceholder}
              placeholder={namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            {editablePhone && (
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
            )}
            {editableNote && (
              <Input
                dir={dir}
                label={noteLabel}
                placeholder={notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}

            <Button fullWidth onClick={handleSave} disabled={saving}>
              {saveLabel}
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
