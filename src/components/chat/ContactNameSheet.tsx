"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { useEffect, useState } from "react";

type ContactNameSheetProps = {
  open: boolean;
  onClose: () => void;
  originalName: string;
  displayName: string;
  onSave: (name: string) => void;
  title: string;
  originalLabel: string;
  placeholder: string;
  saveLabel: string;
  dir?: "ltr" | "rtl";
};

export function ContactNameSheet({
  open,
  onClose,
  originalName,
  displayName,
  onSave,
  title,
  originalLabel,
  placeholder,
  saveLabel,
  dir = "rtl",
}: ContactNameSheetProps) {
  const [name, setName] = useState(displayName);

  useEffect(() => {
    if (open) setName(displayName);
  }, [open, displayName]);

  const handleSave = () => {
    onSave(name.trim());
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div dir={dir} className="space-y-4">
        <div className="rounded-xl bg-[var(--jobchat-surface)] p-4">
          <p className="text-sm text-gray-500">{originalLabel}</p>
          <p className="mt-1 font-medium text-gray-900">{originalName}</p>
        </div>
        <Input
          label={placeholder}
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button fullWidth onClick={handleSave}>
          {saveLabel}
        </Button>
      </div>
    </Sheet>
  );
}
