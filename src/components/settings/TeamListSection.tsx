"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import {
  MAX_MANAGERS_PER_COMPANY,
  MAX_WORKERS_PER_COMPANY,
} from "@/lib/constants/limits";
import { useSlangStore } from "@/lib/store";
import type { Manager, Worker } from "@/types";
import { Trash2 } from "lucide-react";

export function TeamListSection() {
  const managers = useSlangStore((s) => s.managers);
  const workers = useSlangStore((s) => s.workers);
  const managerId = useSlangStore((s) => s.managerId);
  const removeManager = useSlangStore((s) => s.removeManager);
  const removeWorker = useSlangStore((s) => s.removeWorker);
  const { showToast } = useToast();

  const handleRemoveManager = async (manager: Manager) => {
    try {
      await removeManager(manager.id);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "מחיקת המנהל נכשלה"
      );
    }
  };

  const handleRemoveWorker = async (worker: Worker) => {
    try {
      await removeWorker(worker.id);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "מחיקת העובד נכשלה"
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">הנהלה</p>
          <span className="text-xs text-gray-500">
            {managers.length}/{MAX_MANAGERS_PER_COMPANY}
          </span>
        </div>
        {managers.map((manager) => (
          <TeamRow
            key={manager.id}
            name={manager.name}
            phone={manager.phone}
            badge={manager.isAdmin ? "מנהל ראשי" : undefined}
            canRemove={!manager.isAdmin && manager.id !== managerId}
            onRemove={() => void handleRemoveManager(manager)}
          />
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">עובדים</p>
          <span className="text-xs text-gray-500">
            {workers.length}/{MAX_WORKERS_PER_COMPANY}
          </span>
        </div>
        {workers.length === 0 ? (
          <p className="rounded-xl bg-[var(--jobchat-surface)] px-4 py-3 text-sm text-gray-500">
            אין עובדים עדיין
          </p>
        ) : (
          workers.map((worker) => (
            <TeamRow
              key={worker.id}
              name={worker.name}
              phone={worker.phone}
              badge={worker.status === "pending" ? "ממתין" : undefined}
              canRemove
              onRemove={() => void handleRemoveWorker(worker)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TeamRow({
  name,
  phone,
  badge,
  canRemove,
  onRemove,
}: {
  name: string;
  phone: string;
  badge?: string;
  canRemove?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-xl bg-[var(--jobchat-surface)] px-3 py-2.5">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900">{name}</p>
          {badge && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {badge}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-500" dir="ltr">
          {phone}
        </p>
      </div>
      {canRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-500 active:bg-red-50"
          aria-label="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
