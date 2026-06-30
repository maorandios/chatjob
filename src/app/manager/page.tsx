"use client";

import { AddWorkerSheet } from "@/components/manager/AddWorkerSheet";
import { ChatListItem } from "@/components/manager/ChatListItem";
import { ContactSearchField } from "@/components/manager/ContactSearchField";
import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { AppListHeader } from "@/components/settings/AppListHeader";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { AppShell } from "@/components/ui/AppShell";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useToast } from "@/components/ui/Toast";
import { CONTACT_PAGE_SIZE } from "@/lib/constants/limits";
import { filterWorkersByQuery } from "@/lib/contacts/filter-workers";
import { useManagerInboxPreviews } from "@/lib/hooks/use-slang-data";
import { getInviteShareText } from "@/lib/invites/share-text";
import { useSlangStore } from "@/lib/store";
import { getInviteUrl, getManagerJoinUrl } from "@/lib/utils";
import { MessageCircle, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { useRequireOnboardingComplete } from "@/lib/hooks/use-manager-access";
import { useRouter } from "next/navigation";
import type { Worker } from "@/types";

export default function ManagerPage() {
  const router = useRouter();
  useRequireOnboardingComplete();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const workers = useSlangStore((s) => s.workers);
  const workersHasMore = useSlangStore((s) => s.workersHasMore);
  const messages = useSlangStore((s) => s.messages);
  const contactAliases = useSlangStore((s) => s.contactAliases);
  const loadWorkers = useSlangStore((s) => s.loadWorkers);
  const loadMessagePreviews = useSlangStore((s) => s.loadMessagePreviews);
  const isAdmin = useSlangStore((s) => s.isAdmin);
  const addManager = useSlangStore((s) => s.addManager);
  const addWorker = useSlangStore((s) => s.addWorker);
  const sendMessage = useSlangStore((s) => s.sendMessage);
  const { showToast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeContactTotal, setActiveContactTotal] = useState<number | null>(null);
  const [lastInvite, setLastInvite] = useState<{
    name: string;
    url: string;
    kind: "manager" | "worker";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearch = searchQuery.trim();
  const loadingMoreRef = useRef(false);
  const inboxLoading = useManagerInboxPreviews(normalizedSearch);

  useEffect(() => {
    if (ready && !managerId) {
      router.replace("/login");
    }
  }, [ready, managerId, router]);

  const filteredWorkers = useMemo(
    () => {
      const visible = normalizedSearch
        ? workers
        : filterWorkersByQuery(workers, searchQuery, contactAliases);
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
    [workers, searchQuery, normalizedSearch, contactAliases, managerId, messages]
  );

  const handleRefresh = useCallback(async () => {
    if (!managerId) return;
    await Promise.all([
      loadWorkers({
        limit: CONTACT_PAGE_SIZE,
        offset: 0,
        query: normalizedSearch,
      }),
      loadMessagePreviews({ managerId }),
    ]);
  }, [managerId, normalizedSearch, loadWorkers, loadMessagePreviews]);

  const handleLoadMore = useCallback(async () => {
    if (!workersHasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      await loadWorkers({
        append: true,
        limit: CONTACT_PAGE_SIZE,
        offset: workers.length,
        query: normalizedSearch,
      });
    } finally {
      loadingMoreRef.current = false;
    }
  }, [workersHasMore, workers.length, normalizedSearch, loadWorkers]);

  const handleListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight > 240) return;
      void handleLoadMore();
    },
    [handleLoadMore]
  );

  const canAddMember = isAdmin;

  const handleAddMember = async ({
    name,
    phone,
    userType,
    privateNote,
  }: {
    name: string;
    phone?: string;
    userType: "management" | "worker";
    privateNote?: string;
  }) => {
    setIsAdding(true);
    try {
      if (userType === "management") {
        const manager = await addManager(name, phone ?? "");
        setLastInvite({
          name: manager.name,
          url: getManagerJoinUrl(manager.inviteToken),
          kind: "manager",
        });
      } else {
        const worker = await addWorker(name, phone, {
          privateNote,
        });
        setLastInvite({
          name,
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

  const fetchActiveContactPage = useCallback(
    async (offset: number, limit: number) => {
      if (!managerId) return { workers: [] as Worker[], hasMore: false, total: 0 };
      const params = new URLSearchParams({
        managerId,
        activeOnly: "true",
        offset: String(offset),
        limit: String(limit),
      });
      const res = await fetch(`/api/workers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load worker contacts");
      const data = await res.json();
      return {
        workers: (data.workers ?? []) as Worker[],
        hasMore: Boolean(data.hasMore),
        total: Number(data.total ?? 0),
      };
    },
    [managerId]
  );

  useEffect(() => {
    if (!showAdd || !managerId) return;
    let cancelled = false;
    setActiveContactTotal(null);
    void fetchActiveContactPage(0, 1)
      .then((page) => {
        if (!cancelled) setActiveContactTotal(page.total);
      })
      .catch(() => {
        if (!cancelled) setActiveContactTotal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showAdd, managerId, fetchActiveContactPage]);

  const handleBroadcastSubmit = ({
    workerIds,
    text,
  }: {
    workerIds: string[];
    text: string;
  }) => {
    if (!managerId || workerIds.length === 0) return;
    const recipients = workers.filter((worker) => workerIds.includes(worker.id));
    const managerIdForSend = managerId;
    setShowAdd(false);
    showToast("השליחה לרשימת התפוצה התחילה ברקע");

    void (async () => {
      try {
        const results = await Promise.allSettled(
          recipients.map((worker) =>
            sendMessage(
              managerIdForSend,
              worker.id,
              "manager",
              text,
              worker.language
            )
          )
        );
        const failed = results.filter((result) => result.status === "rejected").length;
        const sent = results.length - failed;
        showToast(
          failed > 0
            ? `השליחה הסתיימה: נשלח ל-${sent}, נכשל ל-${failed}`
            : `השליחה לרשימת התפוצה הסתיימה (${sent})`
        );
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "שליחת ההודעה נכשלה"
        );
      }
    })();
  };

  const handleBroadcastAllSubmit = ({ text }: { text: string }) => {
    if (!managerId) return;
    const managerIdForSend = managerId;
    setShowAdd(false);
    showToast("השליחה לכל אנשי הקשר התחילה ברקע");

    void (async () => {
      try {
        const recipients: Worker[] = [];
        let offset = 0;
        let hasMore = true;
        while (hasMore) {
          const page = await fetchActiveContactPage(offset, 50);
          recipients.push(...page.workers);
          offset += page.workers.length;
          hasMore = page.hasMore && page.workers.length > 0;
          if (activeContactTotal !== page.total) {
            setActiveContactTotal(page.total);
          }
        }

        const results = await Promise.allSettled(
          recipients.map((worker) =>
            sendMessage(
              managerIdForSend,
              worker.id,
              "manager",
              text,
              worker.language
            )
          )
        );
        const failed = results.filter((result) => result.status === "rejected").length;
        const sent = results.length - failed;
        showToast(
          failed > 0
            ? `השליחה הסתיימה: נשלח ל-${sent}, נכשל ל-${failed}`
            : `השליחה לכל אנשי הקשר הסתיימה (${sent})`
        );
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "שליחת ההודעה נכשלה"
        );
      }
    })();
  };

  if (!ready || !managerId) {
    return (
      <AppShell dir="rtl">
        <AppLoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell dir="rtl" className="relative">
      <AppListHeader settingsHref="/manager/settings" />

      {inboxLoading ? (
        <AppLoadingState />
      ) : workers.length === 0 ? (
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
            onScroll={handleListScroll}
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

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 border-t border-[var(--jobchat-border)] bg-white px-4 py-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={isAdding}
          className="pointer-events-auto flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-gray-700 active:bg-gray-100 disabled:opacity-60"
          aria-label="פעולות"
        >
          <Settings2 className="h-5 w-5" />
          פעולות
        </button>
      </div>

      <AddWorkerSheet
        open={showAdd}
        loading={isAdding}
        onClose={() => setShowAdd(false)}
        onSubmit={(data) => void handleAddMember(data)}
        workers={workers}
        contactAliases={contactAliases}
        onBroadcastSubmit={(data) => void handleBroadcastSubmit(data)}
        totalWorkerContacts={activeContactTotal}
        onBroadcastAllSubmit={(data) => void handleBroadcastAllSubmit(data)}
        disableManagement={!canAddMember}
        disableWorker={!canAddMember}
      />

      {lastInvite && (
        <InviteReadySheet
          open={showInvite}
          onClose={() => setShowInvite(false)}
          memberName={lastInvite.name}
          inviteUrl={lastInvite.url}
          kind={lastInvite.kind}
          whatsappText={getInviteShareText(lastInvite.name, lastInvite.url)}
        />
      )}
    </AppShell>
  );
}
