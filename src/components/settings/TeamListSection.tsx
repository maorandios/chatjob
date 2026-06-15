"use client";

import { TeamMemberRow } from "@/components/settings/TeamMemberRow";
import { useToast } from "@/components/ui/Toast";
import { useSlangStore } from "@/lib/store";
import type { Manager, Worker } from "@/types";

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
          <span className="text-xs text-gray-500">{managers.length}</span>
        </div>
        <div className="space-y-2">
          {managers.map((manager) => (
            <TeamMemberRow
              key={manager.id}
              name={manager.name}
              phone={manager.phone}
              canRemove={!manager.isAdmin && manager.id !== managerId}
              onRemove={() => void handleRemoveManager(manager)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">עובדים</p>
          <span className="text-xs text-gray-500">{workers.length}</span>
        </div>
        {workers.length === 0 ? (
          <p className="rounded-xl bg-[var(--jobchat-surface)] px-4 py-3 text-sm text-gray-500">
            אין עובדים עדיין
          </p>
        ) : (
          <div className="space-y-2">
            {workers.map((worker) => (
              <TeamMemberRow
                key={worker.id}
                name={worker.name}
                phone={worker.phone}
                mutedAvatar={worker.status === "pending"}
                pendingInvite={worker.status === "pending"}
                canRemove
                onRemove={() => void handleRemoveWorker(worker)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
