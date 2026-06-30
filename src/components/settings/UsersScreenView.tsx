"use client";

import { WorkerProfileSheet } from "@/components/chat/WorkerProfileSheet";
import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { ContactSearchField } from "@/components/manager/ContactSearchField";
import { ManagerProfileEditSheet } from "@/components/settings/ManagerProfileEditSheet";
import { TeamMemberRow } from "@/components/settings/TeamMemberRow";
import { Button } from "@/components/ui/Button";
import { MainLoader } from "@/components/ui/MainLoader";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { getInviteShareText } from "@/lib/invites/share-text";
import { getContactDisplayName, useSlangStore } from "@/lib/store";
import { cn, getInviteUrl } from "@/lib/utils";
import { isWorkerInvitePending } from "@/lib/workers/invite-status";
import type { Manager, Worker } from "@/types";
import { CircleUserRound, ShieldUser } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type UIEvent } from "react";

type UsersTab = "managers" | "workers";
const USERS_PAGE_SIZE = 15;

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
  const [searchQuery, setSearchQuery] = useState("");
  const [pagedManagers, setPagedManagers] = useState<Manager[]>([]);
  const [pagedWorkers, setPagedWorkers] = useState<Worker[]>([]);
  const [managersHasMore, setManagersHasMore] = useState(false);
  const [workersHasMore, setWorkersHasMore] = useState(false);
  const [managerTotal, setManagerTotal] = useState(0);
  const [workerTotal, setWorkerTotal] = useState(0);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const contactAliases = useSlangStore((s) => s.contactAliases);
  const managerId = useSlangStore((s) => s.managerId);
  const removeManager = useSlangStore((s) => s.removeManager);
  const removeWorker = useSlangStore((s) => s.removeWorker);
  const updateManagerProfile = useSlangStore((s) => s.updateManagerProfile);
  const updateManagerById = useSlangStore((s) => s.updateManagerById);
  const updateWorkerProfile = useSlangStore((s) => s.updateWorkerProfile);
  const { showToast } = useToast();

  const fetchUsersPage = useCallback(
    async (targetTab: UsersTab, offset: number, append: boolean, query: string) => {
      if (!managerId) return;

      const requestId = requestIdRef.current;
      if (!append) {
        if (targetTab === "managers") setLoadingManagers(true);
        if (targetTab === "workers") setLoadingWorkers(true);
      }

      try {
        const params = new URLSearchParams({
          managerId,
          limit: String(USERS_PAGE_SIZE),
          offset: String(offset),
        });
        const normalizedQuery = query.trim();
        if (normalizedQuery) params.set("q", normalizedQuery);

        const endpoint =
          targetTab === "managers"
            ? `/api/managers?${params.toString()}`
            : `/api/workers?${params.toString()}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to load users");

        const data = await res.json();
        if (requestId !== requestIdRef.current) return;

        if (targetTab === "managers") {
          const nextManagers = (data.managers ?? []) as Manager[];
          setPagedManagers((current) =>
            append ? mergeUsersById(current, nextManagers) : nextManagers
          );
          setManagersHasMore(Boolean(data.hasMore));
          setManagerTotal(Number(data.total ?? nextManagers.length));
        } else {
          const nextWorkers = (data.workers ?? []) as Worker[];
          setPagedWorkers((current) =>
            append ? mergeUsersById(current, nextWorkers) : nextWorkers
          );
          setWorkersHasMore(Boolean(data.hasMore));
          setWorkerTotal(Number(data.total ?? nextWorkers.length));
        }
      } catch (error) {
        console.warn("[Slang] Failed to load users page", error);
        showToast("טעינת המשתמשים נכשלה");
      } finally {
        if (requestId !== requestIdRef.current) return;
        if (targetTab === "managers") setLoadingManagers(false);
        if (targetTab === "workers") setLoadingWorkers(false);
      }
    },
    [managerId, showToast]
  );

  useEffect(() => {
    if (!managerId) return;
    const timeout = window.setTimeout(() => {
      requestIdRef.current += 1;
      void Promise.all([
        fetchUsersPage("managers", 0, false, searchQuery),
        fetchUsersPage("workers", 0, false, searchQuery),
      ]);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [fetchUsersPage, managerId, searchQuery]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    const hasMore = tab === "managers" ? managersHasMore : workersHasMore;
    if (!hasMore) return;

    loadingMoreRef.current = true;
    try {
      await fetchUsersPage(
        tab,
        tab === "managers" ? pagedManagers.length : pagedWorkers.length,
        true,
        searchQuery
      );
    } finally {
      loadingMoreRef.current = false;
    }
  }, [
    fetchUsersPage,
    managersHasMore,
    pagedManagers.length,
    pagedWorkers.length,
    searchQuery,
    tab,
    workersHasMore,
  ]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight > 220) return;
      void handleLoadMore();
    },
    [handleLoadMore]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "manager") {
        await removeManager(deleteTarget.user.id);
        setPagedManagers((current) =>
          current.filter((manager) => manager.id !== deleteTarget.user.id)
        );
        setManagerTotal((current) => Math.max(0, current - 1));
      } else {
        await removeWorker(deleteTarget.user.id);
        setPagedWorkers((current) =>
          current.filter((worker) => worker.id !== deleteTarget.user.id)
        );
        setWorkerTotal((current) => Math.max(0, current - 1));
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
    setPagedManagers((current) =>
      current.map((manager) =>
        manager.id === editingManager.id ? { ...manager, ...profile } : manager
      )
    );
  };

  return (
    <>
      <div
        className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-5"
        onScroll={handleScroll}
      >
        <div className="mb-4 flex gap-1 rounded-xl border border-[var(--jobchat-border)] bg-white/25 p-1">
          <TabButton
            active={tab === "managers"}
            onClick={() => setTab("managers")}
            label="מנהלים"
            icon={ShieldUser}
            count={managerTotal}
          />
          <TabButton
            active={tab === "workers"}
            onClick={() => setTab("workers")}
            label="עובדים"
            icon={CircleUserRound}
            count={workerTotal}
          />
        </div>
        <ContactSearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="חיפוש משתמשים"
          className="mb-4"
        />

        <div className="space-y-2">
          {tab === "managers" ? (
            loadingManagers && pagedManagers.length === 0 ? (
              <LoadingState />
            ) : pagedManagers.length === 0 ? (
              <EmptyState message="אין מנהלים רשומים" />
            ) : (
              <>
                {pagedManagers.map((manager) => (
                  <TeamMemberRow
                    key={manager.id}
                    name={manager.name}
                    phone={manager.phone}
                    email={manager.email}
                    imageUrl={manager.profileImageUrl}
                    onPress={() => setEditingManager(manager)}
                    canRemove={!manager.isAdmin && manager.id !== managerId}
                    onRemove={() =>
                      setDeleteTarget({ kind: "manager", user: manager })
                    }
                  />
                ))}
                {loadingManagers && <LoadingMoreState />}
              </>
            )
          ) : loadingWorkers && pagedWorkers.length === 0 ? (
            <LoadingState />
          ) : pagedWorkers.length === 0 ? (
            <EmptyState message="אין עובדים רשומים" />
          ) : (
            <>
              {pagedWorkers.map((worker) => {
                const displayName = getContactDisplayName(
                  contactAliases,
                  "manager",
                  worker.id,
                  worker.name
                );

                return (
                  <TeamMemberRow
                    key={worker.id}
                    name={displayName}
                    phone={worker.phone}
                    email={worker.email}
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
                );
              })}
              {loadingWorkers && <LoadingMoreState />}
            </>
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
          email={editingManager.email}
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
          displayName={getContactDisplayName(
            contactAliases,
            "manager",
            editingWorker.id,
            editingWorker.name
          )}
          displayPhone={editingWorker.phone}
          email={editingWorker.email}
          imageUrl={editingWorker.profileImageUrl}
          copyPhone={editingWorker.phone}
          privateNote={editingWorker.privateNote}
          onSave={async (profile) => {
            try {
              await updateWorkerProfile(editingWorker.id, profile);
              setPagedWorkers((current) =>
                current.map((worker) =>
                  worker.id === editingWorker.id
                    ? {
                        ...worker,
                        name: profile.name,
                        phone: profile.phone,
                        privateNote: profile.privateNote,
                      }
                    : worker
                )
              );
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
          memberName={getContactDisplayName(
            contactAliases,
            "manager",
            inviteWorker.id,
            inviteWorker.name
          )}
          inviteUrl={getInviteUrl(inviteWorker.inviteToken)}
          kind="worker"
          title="קישור הצטרפות"
          subtitle={`שלחו ל-${getContactDisplayName(
            contactAliases,
            "manager",
            inviteWorker.id,
            inviteWorker.name
          )} את קישור ההזמנה`}
          showCelebration={false}
          whatsappText={getInviteShareText(
            getContactDisplayName(
              contactAliases,
              "manager",
              inviteWorker.id,
              inviteWorker.name
            ),
            getInviteUrl(inviteWorker.inviteToken)
          )}
        />
      )}
    </>
  );
}

function mergeUsersById<T extends { id: string }>(current: T[], page: T[]): T[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  const next = [...current];
  for (const item of page) {
    if (byId.has(item.id)) continue;
    byId.set(item.id, item);
    next.push(item);
  }
  return next;
}

function LoadingState() {
  return (
    <div className="flex justify-center rounded-xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-10">
      <MainLoader />
    </div>
  );
}

function LoadingMoreState() {
  return (
    <div className="flex justify-center py-3">
      <MainLoader />
    </div>
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
