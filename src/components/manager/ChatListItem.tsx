"use client";

import { InviteReadySheet } from "@/components/manager/InviteReadySheet";
import { Avatar } from "@/components/ui/Avatar";
import {
  getMessageDisplayText,
  useHasUnreadMessages,
  useContactDisplayName,
  useLastMessage,
  useSlangStore,
} from "@/lib/store";
import { formatListTime, getInviteUrl, getManagerChatPath } from "@/lib/utils";
import { isWorkerInvitePending } from "@/lib/workers/invite-status";
import type { Worker } from "@/types";
import { Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ChatListItemProps = {
  worker: Worker;
};

const pendingCardClassName =
  "flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-gray-100/70 px-4 py-3.5";

const activeCardClassName =
  "flex items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/15 px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-white/25 active:bg-white/30";

export function ChatListItem({ worker }: ChatListItemProps) {
  const managerId = useSlangStore((s) => s.managerId) ?? "";
  const lastMessage = useLastMessage(managerId, worker.id);
  const hasUnread = useHasUnreadMessages(managerId, worker.id, "manager");
  const displayName = useContactDisplayName("manager", worker.id, worker.name);
  const [showInviteSheet, setShowInviteSheet] = useState(false);

  const isPending = isWorkerInvitePending(worker);
  const inviteUrl = getInviteUrl(worker.inviteToken);

  const preview = lastMessage
    ? getMessageDisplayText(lastMessage, "manager", worker.language)
    : "אין הודעות עדיין";

  const time = lastMessage ? formatListTime(lastMessage.createdAt) : "";

  if (isPending) {
    return (
      <>
        <div className={pendingCardClassName}>
          <Avatar
            name={displayName}
            className="bg-gray-200 text-gray-500"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-600">{displayName}</p>
            <p className="mt-0.5 truncate text-sm text-gray-400">
              ממתין להצטרפות
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInviteSheet(true)}
            className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center self-center rounded-full bg-[var(--jobchat-accent)] text-white active:scale-[0.98] active:opacity-90"
            aria-label="שלח קישור"
          >
            <Send className="h-4 w-4 shrink-0" />
          </button>
        </div>

        <InviteReadySheet
          open={showInviteSheet}
          onClose={() => setShowInviteSheet(false)}
          memberName={displayName}
          inviteUrl={inviteUrl}
          kind="worker"
          title="קישור הצטרפות"
          subtitle={`שלחו ל-${displayName} את קישור ההזמנה`}
          showCelebration={false}
          whatsappText={`${displayName}, הוזמנת ל-Slang: ${inviteUrl}`}
        />
      </>
    );
  }

  return (
    <Link href={getManagerChatPath(worker.inviteToken)} className={activeCardClassName}>
      <Avatar name={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-gray-900">{displayName}</p>
          <div className="flex shrink-0 items-center gap-2">
            {hasUnread && (
              <span
                className="h-2.5 w-2.5 rounded-full bg-[var(--jobchat-accent)]"
                aria-label="הודעה חדשה"
              />
            )}
            {time && (
              <span className="text-xs text-gray-500">{time}</span>
            )}
          </div>
        </div>
        <p className="truncate text-sm text-gray-500">{preview}</p>
      </div>
    </Link>
  );
}
