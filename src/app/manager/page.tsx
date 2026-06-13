"use client";

import { AddWorkerSheet } from "@/components/manager/AddWorkerSheet";
import { ChatListItem } from "@/components/manager/ChatListItem";
import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { ManagerSettingsSheet } from "@/components/manager/ManagerSettingsSheet";
import { useJobChatStore } from "@/lib/mock/store";
import { MessageCircle, Plus, Settings } from "lucide-react";
import { useState } from "react";

export default function ManagerPage() {
  const workers = useJobChatStore((s) => s.workers);
  const addWorker = useJobChatStore((s) => s.addWorker);

  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAdded, setLastAdded] = useState<{
    name: string;
    token: string;
  } | null>(null);

  const handleAddWorker = (name: string, phone: string) => {
    const worker = addWorker(name, phone);
    setLastAdded({ name: worker.name, token: worker.inviteToken });
    setShowAdd(false);
    setShowInvite(true);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="z-20 shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">JobChat</h1>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-[var(--jobchat-surface)]"
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
        <div className="chat-scrollbar flex-1 overflow-y-auto bg-[var(--jobchat-surface)]">
          {workers.map((worker) => (
            <ChatListItem key={worker.id} worker={worker} />
          ))}
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center safe-bottom">
        <div className="pointer-events-auto relative w-full max-w-[430px]">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="absolute bottom-6 start-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-white shadow-[0_4px_20px_rgba(0,60,255,0.35)] transition-transform hover:scale-105 active:scale-95"
            aria-label="Add worker"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AddWorkerSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAddWorker}
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
    </div>
  );
}
