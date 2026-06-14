"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { cn, isValidIsraeliPhone } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

type UserType = "management" | "worker";

type AddWorkerSheetProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    phone: string,
    userType: UserType
  ) => void;
  disableManagement?: boolean;
  disableWorker?: boolean;
};

const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: "management", label: "הנהלה" },
  { value: "worker", label: "עובד" },
];

export function AddWorkerSheet({
  open,
  loading = false,
  onClose,
  onSubmit,
  disableManagement = false,
  disableWorker = false,
}: AddWorkerSheetProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<UserType>("worker");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const resetForm = () => {
    setName("");
    setPhone("");
    setUserType("worker");
    setErrors({});
  };

  const handleSubmit = () => {
    if (loading) return;

    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם";
    if (!isValidIsraeliPhone(phone))
      nextErrors.phone = "נא להזין מספר טלפון תקין (9-10 ספרות)";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmit(name.trim(), phone, userType);
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open && !loading) {
      resetForm();
    }
  }, [open, loading]);

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={loading ? undefined : "יצירת משתמש חדש"}
      dir="rtl"
    >
      {loading ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--jobchat-accent)]" />
          <p className="mt-4 text-base font-medium text-gray-900">
            יוצרים קישור להזמנה
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
            placeholder="0522148799"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
          />

          <div>
            <p className="mb-2 text-right text-sm font-medium text-gray-700">
              סוג משתמש
            </p>
            <div className="grid grid-cols-2 gap-3">
              {USER_TYPE_OPTIONS.map((option) => {
                const selected = userType === option.value;
                const disabled =
                  (option.value === "management" && disableManagement) ||
                  (option.value === "worker" && disableWorker);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setUserType(option.value)}
                    className={cn(
                      "min-h-12 rounded-xl border px-4 text-base font-medium transition-colors",
                      disabled && "cursor-not-allowed opacity-40",
                      selected
                        ? "border-[var(--jobchat-accent)] bg-[var(--jobchat-accent)]/10 text-[var(--jobchat-accent)]"
                        : "border-[var(--jobchat-border)] bg-white text-gray-700 active:bg-[var(--jobchat-surface)]"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button fullWidth onClick={handleSubmit}>
            צור הזמנה
          </Button>
        </div>
      )}
    </Sheet>
  );
}
