"use client";

import { Avatar } from "@/components/ui/Avatar";
import {
  getMessageDisplayText,
  useContactDisplayName,
  useLastMessage,
} from "@/lib/mock/store";
import { formatListTime } from "@/lib/utils";
import type { Worker } from "@/types";
import Link from "next/link";

type ChatListItemProps = {
  worker: Worker;
};

export function ChatListItem({ worker }: ChatListItemProps) {
  const lastMessage = useLastMessage(worker.id);
  const displayName = useContactDisplayName("manager", worker.id, worker.name);

  const preview = lastMessage
    ? getMessageDisplayText(lastMessage, "manager", worker.language)
    : worker.status === "pending"
      ? "ממתין להצטרפות"
      : "אין הודעות עדיין";

  const time = lastMessage ? formatListTime(lastMessage.createdAt) : "";

  return (
    <Link
      href={`/manager/chat/${worker.id}`}
      className="flex items-center gap-3 border-b border-[var(--jobchat-border)] bg-white px-4 py-3.5 transition-colors hover:bg-[var(--jobchat-surface)] active:bg-gray-100"
    >
      <Avatar name={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-gray-900">{displayName}</p>
          {time && (
            <span className="shrink-0 text-xs text-gray-500">{time}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-gray-500">{preview}</p>
          {worker.status === "pending" && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              ממתין
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
