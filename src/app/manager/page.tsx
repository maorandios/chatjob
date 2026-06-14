"use client";

import { AddWorkerSheet } from "@/components/manager/AddWorkerSheet";
import { ChatListItem } from "@/components/manager/ChatListItem";
import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { AppListHeader } from "@/components/settings/AppListHeader";
import { AppShell } from "@/components/ui/AppShell";
import { useToast } from "@/components/ui/Toast";
import {
  MAX_MANAGERS_PER_COMPANY,
  MAX_WORKERS_PER_COMPANY,
} from "@/lib/constants/limits";
import { clearStoredManagerId } from "@/lib/manager-session";
import { useSlangStore } from "@/lib/store";
import { getInviteUrl, getManagerJoinUrl } from "@/lib/utils";
import { MessageCircle, Plus } from "lucide-react";
import { useState } from "react";

export default function ManagerPage() {
  const ready = useSlangStore((s) => s.ready);
  const bootstrapError = useSlangStore((s) => s.bootstrapError);
  const bootstrapManager = useSlangStore((s) => s.bootstrapManager);
  const workers = useSlangStore((s) => s.workers);
  const managers = useSlangStore((s) => s.managers);
  const isAdmin = useSlangStore((s) => s.isAdmin);
  const addManager = useSlangStore((s) => s.addManager);
  const addWorker = useSlangStore((s) => s.addWorker);
  const { showToast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lastInvite, setLastInvite] = useState<{
    name: string;
    url: string;
    kind: "manager" | "worker";
  } | null>(null);

  const canAddManager = managers.length < MAX_MANAGERS_PER_COMPANY;
  const canAddWorker = workers.length < MAX_WORKERS_PER_COMPANY;
  const canAddMember = isAdmin && (canAddManager || canAddWorker);

  const handleAddMember = async (
    name: string,
    phone: string,
    userType: "management" | "worker"
  ) => {
    setIsAdding(true);
    try {
      if (userType === "management") {
        if (!canAddManager) {
          showToast(`ניתן להוסיף עד ${MAX_MANAGERS_PER_COMPANY} מנהלים`);
          return;
        }
        const manager = await addManager(name, phone);
        setLastInvite({
          name: manager.name,
          url: getManagerJoinUrl(manager.inviteToken),
          kind: "manager",
        });
      } else {
        if (!canAddWorker) {
          showToast(`ניתן להוסיף עד ${MAX_WORKERS_PER_COMPANY} עובדים`);
          return;
        }
        const worker = await addWorker(name, phone);
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

  const handleRetryBootstrap = async () => {
    setRetrying(true);
    try {
      clearStoredManagerId();
      useSlangStore.setState({
        ready: false,
        bootstrapError: null,
        managerId: null,
        managerInviteToken: "",
      });
      await bootstrapManager();
    } catch {
      // error stored in bootstrapError
    } finally {
      setRetrying(false);
    }
  };

  if (!ready && bootstrapError) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] px-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">לא ניתן להתחבר</h2>
          <p className="mt-2 text-sm text-gray-500">{bootstrapError}</p>
          <p className="mt-2 text-xs text-gray-400">
            אם נפתחתם ישירות ב-/manager, לחצו נסה שוב. מנהלים אחרים צריכים את קישור
            ההזמנה מ-/manager/join/...
          </p>
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleRetryBootstrap()}
            className="mt-6 rounded-xl bg-[var(--jobchat-accent)] px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {retrying ? "מתחבר..." : "נסה שוב"}
          </button>
        </div>
      </AppShell>
    );
  }

  if (!ready) {
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
        <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] pb-24">
          {workers.map((worker) => (
            <ChatListItem key={worker.id} worker={worker} />
          ))}
        </div>
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
        onSubmit={(name, phone, userType) =>
          void handleAddMember(name, phone, userType)
        }
        disableManagement={!canAddManager}
        disableWorker={!canAddWorker}
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
