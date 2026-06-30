"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { useEffect, useState } from "react";

export type CompanyDetailsSave = {
  name: string;
};

type CompanyDetailsEditSheetProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  onSave: (data: CompanyDetailsSave) => void | Promise<void>;
};

export function CompanyDetailsEditSheet({
  open,
  onClose,
  name: initialName,
  onSave,
}: CompanyDetailsEditSheetProps) {
  const [name, setName] = useState(initialName);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setErrors({});
  }, [open, initialName]);

  const handleSave = async () => {
    const nextErrors: { name?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם חברה";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} dir="rtl" showCloseButton={false}>
      <div dir="rtl" className="space-y-4">
        <p className="text-center text-[17px] font-semibold text-gray-900">
          עריכת פרטי חברה
        </p>
        <Input
          dir="rtl"
          label="שם החברה"
          placeholder="שם החברה"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <div className="flex gap-3 pt-1">
          <Button
            variant="ghost"
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
