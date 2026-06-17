"use client";

import { Avatar } from "@/components/ui/Avatar";
import {
  getMessageDisplayText,
  useContactDisplayName,
  useLastMessage,
} from "@/lib/store";
import { formatListTime } from "@/lib/utils";
import type { LanguageCode, Manager } from "@/types";
import Link from "next/link";

type ManagerChatListItemProps = {
  inviteToken: string;
  workerId: string;
  manager: Manager;
  workerLanguage: LanguageCode;
  emptyPreview: string;
};

export function ManagerChatListItem({
  inviteToken,
  workerId,
  manager,
  workerLanguage,
  emptyPreview,
}: ManagerChatListItemProps) {
  const lastMessage = useLastMessage(manager.id, workerId);
  const displayName = useContactDisplayName("worker", manager.id, manager.name);

  const preview = lastMessage
    ? getMessageDisplayText(lastMessage, "worker", workerLanguage)
    : emptyPreview;

  const time = lastMessage ? formatListTime(lastMessage.createdAt) : "";

  return (
    <Link
      href={`/invite/${inviteToken}/chat/${manager.id}`}
      className="flex items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/15 px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-white/25 active:bg-white/30"
    >
      <Avatar name={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-gray-900">{displayName}</p>
          {time && (
            <span className="shrink-0 text-xs text-gray-500">{time}</span>
          )}
        </div>
        <p className="truncate text-sm text-gray-500">{preview}</p>
      </div>
    </Link>
  );
}
