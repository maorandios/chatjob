"use client";

import { Avatar } from "@/components/ui/Avatar";
import {
  getMessagePreviewIcon,
  getMessageDisplayText,
  useContactDisplayName,
  useHasUnreadMessages,
  useLastMessage,
} from "@/lib/store";
import { formatListTime, getWorkerChatPath } from "@/lib/utils";
import type { LanguageCode, Manager } from "@/types";
import { Camera, MapPin } from "lucide-react";
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
  const hasUnread = useHasUnreadMessages(manager.id, workerId, "worker");
  const displayName = useContactDisplayName("worker", manager.id, manager.name);

  const preview = lastMessage
    ? getMessageDisplayText(lastMessage, "worker", workerLanguage)
    : emptyPreview;
  const previewIcon = getMessagePreviewIcon(lastMessage);

  const time = lastMessage ? formatListTime(lastMessage.createdAt) : "";

  return (
    <Link
      href={getWorkerChatPath(inviteToken, manager.id)}
      className="flex items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/15 px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-white/25 active:bg-white/30"
    >
      <Avatar name={displayName} imageUrl={manager.profileImageUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-gray-900">{displayName}</p>
          <div className="flex shrink-0 items-center gap-2">
            {hasUnread && (
              <span
                className="h-2.5 w-2.5 rounded-full bg-[var(--jobchat-accent)]"
                aria-label="Unread message"
              />
            )}
            {time && (
              <span className="text-xs text-gray-500">{time}</span>
            )}
          </div>
        </div>
        <p className="flex items-center gap-1.5 truncate text-sm text-gray-500">
          {previewIcon === "image" && (
            <Camera className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          )}
          {previewIcon === "location" && (
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          )}
          <span className="truncate">{preview}</span>
        </p>
      </div>
    </Link>
  );
}
