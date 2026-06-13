"use client";

import { Avatar } from "@/components/ui/Avatar";
import { getMessageDisplayText, useContactDisplayName, useLastMessage } from "@/lib/mock/store";
import { formatListTime } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import Link from "next/link";

type WorkerChatListItemProps = {
  inviteToken: string;
  workerId: string;
  managerName: string;
  workerLanguage: LanguageCode;
  emptyPreview: string;
};

export function WorkerChatListItem({
  inviteToken,
  workerId,
  managerName,
  workerLanguage,
  emptyPreview,
}: WorkerChatListItemProps) {
  const lastMessage = useLastMessage(workerId);
  const displayName = useContactDisplayName("worker", workerId, managerName);

  const preview = lastMessage
    ? getMessageDisplayText(lastMessage, "worker", workerLanguage)
    : emptyPreview;

  const time = lastMessage ? formatListTime(lastMessage.createdAt) : "";

  return (
    <Link
      href={`/invite/${inviteToken}/chat`}
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
        <p className="truncate text-sm text-gray-500">{preview}</p>
      </div>
    </Link>
  );
}
