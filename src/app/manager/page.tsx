"use client";

import { AddWorkerSheet } from "@/components/manager/AddWorkerSheet";
import { ChatListItem } from "@/components/manager/ChatListItem";
import { ContactSearchField } from "@/components/manager/ContactSearchField";
import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { AppListHeader } from "@/components/settings/AppListHeader";
import { AppShell } from "@/components/ui/AppShell";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useToast } from "@/components/ui/Toast";
import { filterWorkersByQuery } from "@/lib/contacts/filter-workers";
import { useManagerInboxPreviews } from "@/lib/hooks/use-slang-data";
import { useSlangStore } from "@/lib/store";
import { getInviteUrl, getManagerJoinUrl } from "@/lib/utils";
import { MessageCircle, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRequireOnboardingComplete } from "@/lib/hooks/use-manager-access";
import { useRouter } from "next/navigation";

export default function ManagerPage() {
  const router = useRouter();
  useRequireOnboardingComplete();
  useManagerInboxPreviews();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const workers = useSlangStore((s) => s.workers);
  const messages = useSlangStore((s) => s.messages);
  const contactAliases = useSlangStore((s) => s.contactAliases);
  const loadWorkers = useSlangStore((s) => s.loadWorkers);
  const loadMessagePreviews = useSlangStore((s) => s.loadMessagePreviews);
  const managers = useSlangStore((s) => s.managers);
  const isAdmin = useSlangStore((s) => s.isAdmin);
  const addManager = useSlangStore((s) => s.addManager);
  const addWorker = useSlangStore((s) => s.addWorker);
  const { showToast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [lastInvite, setLastInvite] = useState<{
    name: string;
    url: string;
    kind: "manager" | "worker";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (ready && !managerId) {
      router.replace("/login");
    }
  }, [ready, managerId, router]);

  const filteredWorkers = useMemo(
    () => {
      const visible = filterWorkersByQuery(workers, searchQuery, contactAliases);
      if (!managerId) return visible;

      const latestByWorker = new Map<string, number>();
      for (const message of messages) {
        if (message.managerId !== managerId) continue;
        const current = latestByWorker.get(message.workerId) ?? 0;
        const next = new Date(message.createdAt).getTime();
        if (next > current) latestByWorker.set(message.workerId, next);
      }

      return [...visible].sort(
        (a, b) =>
          (latestByWorker.get(b.id) ?? 0) - (latestByWorker.get(a.id) ?? 0)
      );
    },
    [workers, searchQuery, contactAliases, managerId, messages]
  );

  const handleRefresh = useCallback(async () => {
    if (!managerId) return;
    await Promise.all([
      loadWorkers(),
      loadMessagePreviews({ managerId }),
    ]);
  }, [managerId, loadWorkers, loadMessagePreviews]);

  const canAddMember = isAdmin;

  const handleAddMember = async ({
    name,
    phone,
    userType,
    employeeNumber,
    address,
  }: {
    name: string;
    phone: string;
    userType: "management" | "worker";
    employeeNumber?: string;
    address?: string;
  }) => {
    setIsAdding(true);
    try {
      if (userType === "management") {
        const manager = await addManager(name, phone);
        setLastInvite({
          name: manager.name,
          url: getManagerJoinUrl(manager.inviteToken),
          kind: "manager",
        });
      } else {
        const worker = await addWorker(name, phone, {
          employeeNumber,
          address,
        });
        setLastInvite({
          name: worker.name,
          url: getInviteUrl(worker.inviteToken),
          kind: "worker",
        });
      }
      setShowAdd(false);
      setShowInvite(true);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "יצירת ההזמנה נכשלה"
      );
    } finally {
      setIsAdding(false);
    }
  };

  if (!ready || !managerId) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 items-center justify-center bg-[var(--jobchat-surface)]">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell dir="rtl" className="relative">
      <AppListHeader settingsHref="/manager/settings" />

      {workers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] px-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
            <MessageCircle className="h-10 w-10 text-[var(--jobchat-accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isAdmin ? "הוסף עובד כדי להתחיל לשוחח" : "אין עובדים עדיין"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isAdmin
              ? "לחצו + והזמינו עובד או מנהל לצוות"
              : "מנהל הראשי יוסיף עובדים — לאחר מכן תוכלו לשוחח כאן"}
          </p>
        </div>
      ) : (
        <>
          <div className="shrink-0 bg-[var(--jobchat-surface)] px-3 pb-3 pt-2">
            <ContactSearchField
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <PullToRefresh
            onRefresh={handleRefresh}
            className="bg-[var(--jobchat-surface)]"
            contentClassName="bg-[var(--jobchat-surface)]"
          >
            <div className="flex flex-col gap-2 px-3 py-3 pb-24">
              {filteredWorkers.map((worker) => (
                <ChatListItem key={worker.id} worker={worker} />
              ))}
              {filteredWorkers.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-500">
                  לא נמצאו אנשי קשר
                </p>
              )}
            </div>
          </PullToRefresh>
        </>
      )}

      {canAddMember && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={isAdding}
          className="absolute start-6 bottom-6 z-30 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-white shadow-[0_4px_20px_rgba(0,60,255,0.35)] active:scale-95 disabled:opacity-60"
          style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          aria-label="Add member"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <AddWorkerSheet
        open={showAdd}
        loading={isAdding}
        onClose={() => setShowAdd(false)}
        onSubmit={(data) => void handleAddMember(data)}
      />

      {lastInvite && (
        <InviteReadySheet
          open={showInvite}
          onClose={() => setShowInvite(false)}
          memberName={lastInvite.name}
          inviteUrl={lastInvite.url}
          kind={lastInvite.kind}
          whatsappText={
            lastInvite.kind === "manager"
              ? `${lastInvite.name}, הוזמנת כמנהל ב-Slang: ${lastInvite.url}`
              : `${lastInvite.name}, הוזמנת ל-Slang: ${lastInvite.url}`
          }
        />
      )}
    </AppShell>
  );
}
