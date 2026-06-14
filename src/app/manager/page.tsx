"use client";

import { AddWorkerSheet } from "@/components/manager/AddWorkerSheet";
import { ChatListItem } from "@/components/manager/ChatListItem";
import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { ManagerSettingsSheet } from "@/components/manager/ManagerSettingsSheet";
import { AppShell } from "@/components/ui/AppShell";
import { useSlangStore } from "@/lib/store";
import { MessageCircle, Plus, Settings } from "lucide-react";
import { useState } from "react";

export default function ManagerPage() {
  const ready = useSlangStore((s) => s.ready);
  const workers = useSlangStore((s) => s.workers);
  const addWorker = useSlangStore((s) => s.addWorker);

  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [lastAdded, setLastAdded] = useState<{
    name: string;
    token: string;
  } | null>(null);

  const handleAddWorker = async (name: string, phone: string) => {
    setIsAdding(true);
    try {
      const worker = await addWorker(name, phone);
      setLastAdded({ name: worker.name, token: worker.inviteToken });
      setShowAdd(false);
      setShowInvite(true);
    } catch (error) {
      console.error("[Slang] Failed to add worker", error);
    } finally {
      setIsAdding(false);
    }
  };

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
    <AppShell dir="rtl">
      <header className="chrome-top shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Slang</h1>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full text-gray-700 active:bg-[var(--jobchat-surface)]"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {workers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] px-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
            <MessageCircle className="h-10 w-10 text-[var(--jobchat-accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            הוסף עובד כדי להתחיל לשוחח
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            שלח הזמנה לעובד והתחילו לדבר בשפה שלכם
          </p>
        </div>
      ) : (
        <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] pb-24">
          {workers.map((worker) => (
            <ChatListItem key={worker.id} worker={worker} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        disabled={isAdding}
        className="fixed z-30 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-white shadow-[0_4px_20px_rgba(0,60,255,0.35)] active:scale-95 disabled:opacity-60"
        style={{
          bottom: "max(1.5rem, env(safe-area-inset-bottom))",
          left: "max(1.5rem, calc((100vw - var(--app-max-width)) / 2 + 1.5rem))",
        }}
        aria-label="Add worker"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddWorkerSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(name, phone) => void handleAddWorker(name, phone)}
      />

      {lastAdded && (
        <InviteReadySheet
          open={showInvite}
          onClose={() => setShowInvite(false)}
          workerName={lastAdded.name}
          inviteToken={lastAdded.token}
        />
      )}

      <ManagerSettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </AppShell>
  );
}
