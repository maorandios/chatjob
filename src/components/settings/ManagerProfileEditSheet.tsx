"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { isValidIsraeliPhone } from "@/lib/utils";
import { useEffect, useState } from "react";

export type ManagerProfileSave = {
  name: string;
  phone: string;
};

type ManagerProfileEditSheetProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  email?: string;
  onSave: (data: ManagerProfileSave) => void | Promise<void>;
};

export function ManagerProfileEditSheet({
  open,
  onClose,
  name: initialName,
  phone: initialPhone,
  email,
  onSave,
}: ManagerProfileEditSheetProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setPhone(initialPhone);
    setErrors({});
  }, [open, initialName, initialPhone]);

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
    <Sheet open={open} onClose={onClose} dir="rtl" showCloseButton={false}>
      <div dir="rtl" className="space-y-4">
        <p className="text-center text-[17px] font-semibold text-gray-900">
          עריכת פרטים אישיים
        </p>
        {email && (
          <p className="-mt-2 text-center text-xs text-gray-400" dir="ltr">
            {email}
          </p>
        )}
        <Input
          dir="rtl"
          label="שם מלא"
          placeholder="שם מלא"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          dir="rtl"
          label="מספר טלפון"
          placeholder="מספר טלפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          inputMode="tel"
          autoComplete="tel"
        />
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
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
      </div>
    </Sheet>
  );
}
