"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MainLoader } from "@/components/ui/MainLoader";
import { Sheet } from "@/components/ui/Sheet";
import { getContactDisplayName } from "@/lib/store";
import { cn, isValidIsraeliPhone } from "@/lib/utils";
import { isWorkerInvitePending } from "@/lib/workers/invite-status";
import type { ContactAliases, Worker } from "@/types";
import {
  ArrowLeft,
  Check,
  CircleUserRound,
  FileText,
  Megaphone,
  Phone,
  RadioTower,
  Search,
  ShieldUser,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type UserType = "management" | "worker";

export type AddMemberSubmit = {
  name: string;
  phone?: string;
  userType: UserType;
  privateNote?: string;
};

type AddWorkerSheetProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: AddMemberSubmit) => void;
  workers?: Worker[];
  contactAliases?: ContactAliases;
  broadcasting?: boolean;
  onBroadcastSubmit?: (data: { workerIds: string[]; text: string }) => void;
  totalWorkerContacts?: number | null;
  onBroadcastAllSubmit?: (data: { text: string }) => void;
  disableManagement?: boolean;
  disableWorker?: boolean;
};

type Step =
  | "actions"
  | "form"
  | "broadcast-pick"
  | "broadcast-compose"
  | "broadcast-all-compose";

const EMPTY_CONTACT_ALIASES: ContactAliases = { manager: {}, worker: {} };

function FieldLabel({
  icon: Icon,
  text,
  required,
}: {
  icon: typeof UserRound;
  text: string;
  required?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700">
      <Icon className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.9} />
      <span>{text}</span>
      <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden />
      <span className="text-xs font-medium text-gray-400">
        {required ? "חובה" : "אופציונאלי"}
      </span>
    </span>
  );
}

const TYPE_OPTIONS: {
  value: UserType;
  label: string;
  description: string;
  icon: typeof ShieldUser;
}[] = [
  {
    value: "management",
    label: "מנהל",
    description: "צרפו מנהל עבודה למערכת",
    icon: ShieldUser,
  },
  {
    value: "worker",
    label: "עובד",
    description: "צרפו עובד חדש למערכת",
    icon: CircleUserRound,
  },
];

export function AddWorkerSheet({
  open,
  loading = false,
  onClose,
  onSubmit,
  workers = [],
  contactAliases = EMPTY_CONTACT_ALIASES,
  broadcasting = false,
  onBroadcastSubmit,
  totalWorkerContacts = null,
  onBroadcastAllSubmit,
  disableManagement = false,
  disableWorker = false,
}: AddWorkerSheetProps) {
  const [step, setStep] = useState<Step>("actions");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [broadcastQuery, setBroadcastQuery] = useState("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [broadcastText, setBroadcastText] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const resetForm = () => {
    setStep("actions");
    setUserType(null);
    setName("");
    setPhone("");
    setPrivateNote("");
    setBroadcastQuery("");
    setSelectedWorkerIds([]);
    setBroadcastText("");
    setErrors({});
  };

  const handleClose = () => {
    if (loading || broadcasting) return;
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
    if (loading || broadcasting) return;
    if (step === "broadcast-compose") {
      setStep("broadcast-pick");
      return;
    }
    setStep("actions");
    setUserType(null);
    setErrors({});
  };

  const handleSubmit = () => {
    if (loading || !userType) return;

    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "נא להזין שם";
    if (phone.trim() && !isValidIsraeliPhone(phone)) {
      nextErrors.phone = "נא להזין מספר טלפון תקין (9-10 ספרות)";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      userType,
      privateNote: privateNote.trim() || undefined,
    });
  };

  const activeWorkers = useMemo(
    () => workers.filter((worker) => !isWorkerInvitePending(worker)),
    [workers]
  );

  const filteredBroadcastWorkers = useMemo(() => {
    const query = broadcastQuery.trim().toLowerCase();
    if (!query) return activeWorkers;

    return activeWorkers.filter((worker) => {
      const displayName = getContactDisplayName(
        contactAliases,
        "manager",
        worker.id,
        worker.name
      );
      return (
        displayName.toLowerCase().includes(query) ||
        worker.name.toLowerCase().includes(query) ||
        worker.phone.includes(query)
      );
    });
  }, [activeWorkers, broadcastQuery, contactAliases]);

  const toggleWorker = (workerId: string) => {
    setSelectedWorkerIds((current) =>
      current.includes(workerId)
        ? current.filter((id) => id !== workerId)
        : [...current, workerId]
    );
  };

  const handleBroadcastSubmit = () => {
    const text = broadcastText.trim();
    if (!text || selectedWorkerIds.length === 0 || broadcasting) return;
    onBroadcastSubmit?.({ workerIds: selectedWorkerIds, text });
  };

  const handleBroadcastAllSubmit = () => {
    const text = broadcastText.trim();
    if (!text || broadcasting) return;
    onBroadcastAllSubmit?.({ text });
  };

  useEffect(() => {
    if (!open && !loading && !broadcasting) {
      resetForm();
    }
  }, [open, loading, broadcasting]);

  const selectedLabel =
    TYPE_OPTIONS.find((o) => o.value === userType)?.label ?? "";

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      dir="rtl"
      showCloseButton={false}
    >
      {loading || broadcasting ? (
        <div className="flex flex-col items-center py-10 text-center">
          <MainLoader />
        </div>
      ) : step === "actions" ? (
        <div className="space-y-5 pb-1">
          <p className="text-center text-[17px] font-semibold text-gray-900">
            פעולות
          </p>
          <div className="space-y-3">
            {TYPE_OPTIONS.filter((option) => {
              if (option.value === "management") return !disableManagement;
              if (option.value === "worker") return !disableWorker;
              return true;
            }).map((option) => {
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
                    "flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-all active:scale-[0.98]",
                    disabled
                      ? "cursor-not-allowed opacity-40"
                      : "active:bg-white/40"
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      הזמנת {option.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-gray-500">
                      {option.description}
                    </p>
                  </div>
                  <ArrowLeft className="h-5 w-5 shrink-0 text-gray-400" />
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setStep("broadcast-pick")}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-all active:scale-[0.98] active:bg-white/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)]">
                <Megaphone className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  הודעה לרשימת תפוצה
                </p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">
                  שליחת הודעה למספר עובדים
                </p>
              </div>
              <ArrowLeft className="h-5 w-5 shrink-0 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => setStep("broadcast-all-compose")}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-all active:scale-[0.98] active:bg-white/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)]">
                <RadioTower className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  הודעה לכל אנשי הקשר
                </p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">
                  שליחת הודעה לכל העובדים ברשימה
                </p>
              </div>
              <ArrowLeft className="h-5 w-5 shrink-0 text-gray-400" />
            </button>
          </div>
        </div>
      ) : step === "broadcast-pick" ? (
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
            הודעה לרשימת תפוצה
          </p>

          <div className="relative">
            <input
              type="search"
              value={broadcastQuery}
              onChange={(event) => setBroadcastQuery(event.target.value)}
              placeholder="חיפוש עובדים"
              dir="rtl"
              className="min-h-11 w-full rounded-xl border border-[var(--jobchat-border)] bg-white/25 py-2.5 pr-11 pl-4 text-right text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--jobchat-accent)] focus:ring-2 focus:ring-[var(--jobchat-accent)]/20"
            />
            <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="chat-scrollbar max-h-[42vh] space-y-2 overflow-y-auto pr-1">
            {filteredBroadcastWorkers.map((worker) => {
              const displayName = getContactDisplayName(
                contactAliases,
                "manager",
                worker.id,
                worker.name
              );
              const selected = selectedWorkerIds.includes(worker.id);

              return (
                <button
                  key={worker.id}
                  type="button"
                  onClick={() => toggleWorker(worker.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-start transition-colors active:bg-white/40",
                    selected
                      ? "border-[var(--jobchat-accent)] bg-[var(--jobchat-accent-light)]"
                      : "border-[var(--jobchat-border)] bg-white/25"
                  )}
                >
                  <Avatar name={displayName} imageUrl={worker.profileImageUrl} />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {worker.phone}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-[var(--jobchat-accent)] bg-[var(--jobchat-accent)] text-white"
                        : "border-gray-300 bg-white/50"
                    )}
                  >
                    {selected && <Check className="h-4 w-4" />}
                  </span>
                </button>
              );
            })}
            {filteredBroadcastWorkers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">
                לא נמצאו עובדים זמינים
              </p>
            )}
          </div>

          <Button
            fullWidth
            onClick={() => setStep("broadcast-compose")}
            disabled={selectedWorkerIds.length === 0}
            className="!rounded-2xl"
          >
            המשך ({selectedWorkerIds.length})
          </Button>
        </div>
      ) : step === "broadcast-all-compose" ? (
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

          <div className="text-center">
            <p className="text-[17px] font-semibold text-gray-900">
              הודעה לכל אנשי הקשר
            </p>
            <p className="mt-1 text-sm text-gray-500">
              סה״כ אנשי קשר:{" "}
              <span className="font-semibold text-gray-900">
                {totalWorkerContacts ?? "טוען..."}
              </span>
            </p>
          </div>

          <textarea
            value={broadcastText}
            onChange={(event) => setBroadcastText(event.target.value)}
            placeholder="כתוב הודעה"
            dir="rtl"
            rows={5}
            className="w-full resize-none rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-3 text-right text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--jobchat-accent)] focus:ring-2 focus:ring-[var(--jobchat-accent)]/20"
          />
          <Button
            fullWidth
            onClick={handleBroadcastAllSubmit}
            disabled={!broadcastText.trim() || !totalWorkerContacts}
            className="!rounded-2xl"
          >
            שלח לכולם
          </Button>
        </div>
      ) : step === "broadcast-compose" ? (
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
            הודעה ל-{selectedWorkerIds.length} עובדים
          </p>
          <textarea
            value={broadcastText}
            onChange={(event) => setBroadcastText(event.target.value)}
            placeholder="כתוב הודעה"
            dir="rtl"
            rows={5}
            className="w-full resize-none rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-3 text-right text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--jobchat-accent)] focus:ring-2 focus:ring-[var(--jobchat-accent)]/20"
          />
          <Button
            fullWidth
            onClick={handleBroadcastSubmit}
            disabled={!broadcastText.trim() || selectedWorkerIds.length === 0}
            className="!rounded-2xl"
          >
            שלח הודעה
          </Button>
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
            id="add-worker-name"
            dir="rtl"
            label={<FieldLabel icon={UserRound} text="שם מלא" required />}
            placeholder="שם מלא"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            id="add-worker-phone"
            dir="rtl"
            label={<FieldLabel icon={Phone} text="מספר טלפון" />}
            placeholder="0522148799"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
          />

          <Input
            id="add-worker-note"
            dir="rtl"
            label={<FieldLabel icon={FileText} text="תיאור קצר" />}
            placeholder="הערה פרטית לצוות"
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
          />

          <Button fullWidth onClick={handleSubmit} className="!rounded-2xl">
            צור הזמנה
          </Button>
        </div>
      )}
    </Sheet>
  );
}
