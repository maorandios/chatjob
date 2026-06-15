"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { cn, isValidIsraeliPhone } from "@/lib/utils";
import { ArrowLeft, CircleUserRound, Loader2, ShieldUser } from "lucide-react";
import { useEffect, useState } from "react";

export type UserType = "management" | "worker";

export type AddMemberSubmit = {
  name: string;
  phone: string;
  userType: UserType;
  employeeNumber?: string;
  address?: string;
};

type AddWorkerSheetProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: AddMemberSubmit) => void;
  disableManagement?: boolean;
  disableWorker?: boolean;
};

type Step = "pick" | "form";

const TYPE_OPTIONS: {
  value: UserType;
  label: string;
  description: string;
  icon: typeof ShieldUser;
}[] = [
  {
    value: "management",
    label: "מנהל",
    description: "גישה לניהול הצוות",
    icon: ShieldUser,
  },
  {
    value: "worker",
    label: "עובד",
    description: "שיחות עם ההנהלה",
    icon: CircleUserRound,
  },
];

export function AddWorkerSheet({
  open,
  loading = false,
  onClose,
  onSubmit,
  disableManagement = false,
  disableWorker = false,
}: AddWorkerSheetProps) {
  const [step, setStep] = useState<Step>("pick");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const resetForm = () => {
    setStep("pick");
    setUserType(null);
    setName("");
    setPhone("");
    setEmployeeNumber("");
    setAddress("");
    setErrors({});
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handlePickType = (type: UserType) => {
    const disabled =
      (type === "management" && disableManagement) ||
      (type === "worker" && disableWorker);
    if (disabled) return;
    setUserType(type);
    setStep("form");
    setErrors({});
  };

  const handleBack = () => {
    if (loading) return;
    setStep("pick");
    setUserType(null);
    setErrors({});
  };

  const handleSubmit = () => {
    if (loading || !userType) return;

    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם";
    if (!isValidIsraeliPhone(phone)) {
      nextErrors.phone = "נא להזין מספר טלפון תקין (9-10 ספרות)";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      userType,
      employeeNumber:
        userType === "worker" ? employeeNumber.trim() : undefined,
      address: userType === "worker" ? address.trim() : undefined,
    });
  };

  useEffect(() => {
    if (!open && !loading) {
      resetForm();
    }
  }, [open, loading]);

  const selectedLabel =
    TYPE_OPTIONS.find((o) => o.value === userType)?.label ?? "";

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      dir="rtl"
      showCloseButton={false}
    >
      {loading ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--jobchat-accent)]" />
          <p className="mt-4 text-base font-medium text-gray-900">
            יוצרים קישור להזמנה
          </p>
        </div>
      ) : step === "pick" ? (
        <div className="space-y-5 pb-1">
          <p className="text-center text-[17px] font-semibold text-gray-900">
            מי מצטרף לצוות?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map((option) => {
              const disabled =
                (option.value === "management" && disableManagement) ||
                (option.value === "worker" && disableWorker);
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePickType(option.value)}
                  className={cn(
                    "flex flex-col items-center rounded-2xl px-3 py-6 text-center transition-all active:scale-[0.98]",
                    disabled
                      ? "cursor-not-allowed opacity-40"
                      : "bg-[var(--jobchat-surface)] active:bg-gray-100"
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--jobchat-accent)] shadow-[0_2px_8px_rgba(0,60,255,0.12)]">
                    <Icon className="h-7 w-7" strokeWidth={1.75} />
                  </div>
                  <p className="mt-4 text-base font-semibold text-gray-900">
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-gray-500">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-1">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleBack}
              className="flex touch-manipulation items-center gap-1 text-sm font-medium text-gray-500 active:opacity-60"
              dir="ltr"
            >
              <ArrowLeft className="h-4 w-4" />
              חזרה
            </button>
          </div>

          <p className="text-center text-[17px] font-semibold text-gray-900">
            הוספת {selectedLabel}
          </p>

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

          {userType === "worker" && (
            <>
              <Input
                dir="rtl"
                label="מספר עובד"
                placeholder="מספר עובד"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
              />
              <Input
                dir="rtl"
                label="כתובת"
                placeholder="כתובת"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </>
          )}

          <Button fullWidth onClick={handleSubmit} className="!rounded-2xl">
            צור הזמנה
          </Button>
        </div>
      )}
    </Sheet>
  );
}
