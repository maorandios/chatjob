"use client";

import { WorkerProfileSheet } from "@/components/chat/WorkerProfileSheet";
import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { ManagerProfileEditSheet } from "@/components/settings/ManagerProfileEditSheet";
import { TeamMemberRow } from "@/components/settings/TeamMemberRow";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useSlangStore } from "@/lib/store";
import { cn, getInviteUrl } from "@/lib/utils";
import { isWorkerInvitePending } from "@/lib/workers/invite-status";
import type { Manager, Worker } from "@/types";
import { CircleUserRound, ShieldUser } from "lucide-react";
import { useState } from "react";

type UsersTab = "managers" | "workers";

type DeleteTarget =
  | { kind: "manager"; user: Manager }
  | { kind: "worker"; user: Worker };

export function UsersScreenView() {
  const [tab, setTab] = useState<UsersTab>("managers");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [inviteWorker, setInviteWorker] = useState<Worker | null>(null);

  const managers = useSlangStore((s) => s.managers);
  const workers = useSlangStore((s) => s.workers);
  const managerId = useSlangStore((s) => s.managerId);
  const removeManager = useSlangStore((s) => s.removeManager);
  const removeWorker = useSlangStore((s) => s.removeWorker);
  const updateManagerProfile = useSlangStore((s) => s.updateManagerProfile);
  const updateManagerById = useSlangStore((s) => s.updateManagerById);
  const updateWorkerProfile = useSlangStore((s) => s.updateWorkerProfile);
  const { showToast } = useToast();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "manager") {
        await removeManager(deleteTarget.user.id);
      } else {
        await removeWorker(deleteTarget.user.id);
      }
      setDeleteTarget(null);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : deleteTarget.kind === "manager"
            ? "מחיקת המנהל נכשלה"
            : "מחיקת העובד נכשלה"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveManager = async (profile: { name: string; phone: string }) => {
    if (!editingManager) return;
    if (editingManager.id === managerId) {
      await updateManagerProfile(profile);
    } else {
      await updateManagerById(editingManager.id, profile);
    }
  };

  return (
    <>
      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-5">
        <div className="mb-4 flex gap-1 rounded-xl border border-[var(--jobchat-border)] bg-white/25 p-1">
          <TabButton
            active={tab === "managers"}
            onClick={() => setTab("managers")}
            label="מנהלים"
            icon={ShieldUser}
            count={managers.length}
          />
          <TabButton
            active={tab === "workers"}
            onClick={() => setTab("workers")}
            label="עובדים"
            icon={CircleUserRound}
            count={workers.length}
          />
        </div>

        <div className="space-y-2">
          {tab === "managers" ? (
            managers.length === 0 ? (
              <EmptyState message="אין מנהלים רשומים" />
            ) : (
              managers.map((manager) => (
                <TeamMemberRow
                  key={manager.id}
                  name={manager.name}
                  phone={manager.phone}
                  imageUrl={manager.profileImageUrl}
                  onPress={() => setEditingManager(manager)}
                  canRemove={!manager.isAdmin && manager.id !== managerId}
                  onRemove={() =>
                    setDeleteTarget({ kind: "manager", user: manager })
                  }
                />
              ))
            )
          ) : workers.length === 0 ? (
            <EmptyState message="אין עובדים רשומים" />
          ) : (
            workers.map((worker) => (
              <TeamMemberRow
                key={worker.id}
                name={worker.name}
                phone={worker.phone}
                imageUrl={worker.profileImageUrl}
                mutedAvatar={isWorkerInvitePending(worker)}
                onPress={() => setEditingWorker(worker)}
                pendingInvite={isWorkerInvitePending(worker)}
                onSendInvite={() => setInviteWorker(worker)}
                canRemove
                onRemove={() =>
                  setDeleteTarget({ kind: "worker", user: worker })
                }
              />
            ))
          )}
        </div>
      </div>

      <Sheet
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        dir="rtl"
        showCloseButton={false}
      >
        <div dir="rtl" className="space-y-5">
          <p className="text-center text-[17px] font-semibold leading-snug text-gray-900">
            {deleteTarget
              ? `האם למחוק את המשתמש ${deleteTarget.user.name} מהמערכת?`
              : ""}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="!rounded-2xl text-gray-600"
            >
              ביטול
            </Button>
            <Button
              fullWidth
              onClick={() => void handleConfirmDelete()}
              disabled={deleting}
              className="!rounded-2xl bg-red-500 hover:bg-red-600"
            >
              מחק
            </Button>
          </div>
        </div>
      </Sheet>

      {editingManager && (
        <ManagerProfileEditSheet
          open
          onClose={() => setEditingManager(null)}
          name={editingManager.name}
          phone={editingManager.phone}
          onSave={async (profile) => {
            try {
              await handleSaveManager(profile);
            } catch {
              showToast("לא ניתן לעדכן את פרטי המנהל");
              throw new Error("save failed");
            }
          }}
        />
      )}

      {editingWorker && (
        <WorkerProfileSheet
          open
          onClose={() => setEditingWorker(null)}
          displayName={editingWorker.name}
          displayPhone={editingWorker.phone}
          imageUrl={editingWorker.profileImageUrl}
          copyPhone={editingWorker.phone}
          employeeNumber={editingWorker.employeeNumber}
          address={editingWorker.address}
          onSave={async (profile) => {
            try {
              await updateWorkerProfile(editingWorker.id, profile);
            } catch {
              showToast("לא ניתן לעדכן את פרטי העובד");
              throw new Error("save failed");
            }
          }}
          phoneCopiedLabel="מספר טלפון הועתק"
          dir="rtl"
        />
      )}

      {inviteWorker && (
        <InviteReadySheet
          open
          onClose={() => setInviteWorker(null)}
          memberName={inviteWorker.name}
          inviteUrl={getInviteUrl(inviteWorker.inviteToken)}
          kind="worker"
          title="קישור הצטרפות"
          subtitle={`שלחו ל-${inviteWorker.name} את קישור ההזמנה`}
          showCelebration={false}
          whatsappText={`${inviteWorker.name}, הוזמנת ל-Slang: ${getInviteUrl(inviteWorker.inviteToken)}`}
        />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon: Icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof ShieldUser;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center rounded-lg px-2 py-2.5 transition-colors",
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 active:bg-white/50"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl shadow-[0_2px_8px_rgba(0,60,255,0.08)]",
          active
            ? "bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)]"
            : "bg-white/70 text-gray-400"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <span className="mt-1.5 text-sm font-semibold">{label}</span>
      <span className="mt-0.5 text-[11px] tabular-nums text-gray-400">
        {count}
      </span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-8 text-center text-sm text-gray-500">
      {message}
    </p>
  );
}
