"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useJobChatStore } from "@/lib/mock/store";

type ManagerSettingsSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function ManagerSettingsSheet({
  open,
  onClose,
}: ManagerSettingsSheetProps) {
  const companyName = useJobChatStore((s) => s.companyName);
  const managerName = useJobChatStore((s) => s.managerName);

  return (
    <Sheet open={open} onClose={onClose} title="הגדרות">
      <div className="space-y-4">
        <div className="rounded-xl bg-[var(--jobchat-surface)] p-4">
          <p className="text-sm text-gray-500">שם החברה</p>
          <p className="mt-1 font-medium text-gray-900">{companyName}</p>
        </div>
        <div className="rounded-xl bg-[var(--jobchat-surface)] p-4">
          <p className="text-sm text-gray-500">מנהל</p>
          <p className="mt-1 font-medium text-gray-900">{managerName}</p>
        </div>
        <button
          type="button"
          disabled
          className="w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
        >
          התנתקות (בקרוב)
        </button>
        <p className="text-center text-xs text-gray-400">JobChat Prototype</p>
      </div>
    </Sheet>
  );
}
