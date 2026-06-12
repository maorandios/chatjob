"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { isValidIsraeliPhone } from "@/lib/utils";
import { useState } from "react";

type AddWorkerSheetProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => void;
};

export function AddWorkerSheet({ open, onClose, onSubmit }: AddWorkerSheetProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const handleSubmit = () => {
    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם";
    if (!isValidIsraeliPhone(phone))
      nextErrors.phone = "נא להזין מספר טלפון תקין (9-10 ספרות)";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmit(name.trim(), phone);
    setName("");
    setPhone("");
    setErrors({});
  };

  const handleClose = () => {
    setName("");
    setPhone("");
    setErrors({});
    onClose();
  };

  return (
    <Sheet open={open} onClose={handleClose} title="הוספת עובד">
      <div className="space-y-4">
        <Input
          label="שם מלא"
          placeholder="לדוגמה: סומצ'אי"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="מספר טלפון"
          placeholder="05X-XXX-XXXX"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        <Button fullWidth onClick={handleSubmit}>
          צור הזמנה
        </Button>
      </div>
    </Sheet>
  );
}
