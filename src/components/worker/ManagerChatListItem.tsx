"use client";

import { Avatar } from "@/components/ui/Avatar";
import {
  getMessageDisplayText,
  useContactDisplayName,
  useLastMessage,
} from "@/lib/store";
import { formatListTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { LanguageCode, Manager } from "@/types";
import Link from "next/link";

type ManagerChatListItemProps = {
  inviteToken: string;
  workerId: string;
  manager: Manager;
  workerLanguage: LanguageCode;
  emptyPreview: string;
  chatHref?: string;
  variant?: "default" | "telegram";
};

const telegramRowClassName =
  "flex items-center gap-3 border-b px-4 py-3 transition-colors active:opacity-80";

export function ManagerChatListItem({
  inviteToken,
  workerId,
  manager,
  workerLanguage,
  emptyPreview,
  chatHref,
  variant = "default",
}: ManagerChatListItemProps) {
  const lastMessage = useLastMessage(manager.id, workerId);
  const displayName = useContactDisplayName("worker", manager.id, manager.name);

  const preview = lastMessage
    ? getMessageDisplayText(lastMessage, "worker", workerLanguage)
    : emptyPreview;

  const time = lastMessage ? formatListTime(lastMessage.createdAt) : "";
  const href = chatHref ?? `/invite/${inviteToken}/chat/${manager.id}`;
  const rowStyle =
    variant === "telegram"
      ? {
          borderColor: "var(--tg-theme-hint-color, var(--jobchat-border))",
          backgroundColor: "var(--tg-theme-bg-color, transparent)",
        }
      : undefined;

  const cardClassName =
    variant === "telegram"
      ? telegramRowClassName
      : "flex items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/15 px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-white/25 active:bg-white/30";

  return (
    <Link href={href} className={cardClassName} style={rowStyle}>
      <Avatar name={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate font-medium",
              variant !== "telegram" && "text-gray-900"
            )}
            style={
              variant === "telegram"
                ? { color: "var(--tg-theme-text-color, #111827)" }
                : undefined
            }
          >
            {displayName}
          </p>
          {time && (
            <span
              className={cn("shrink-0 text-xs", variant !== "telegram" && "text-gray-500")}
              style={
                variant === "telegram"
                  ? { color: "var(--tg-theme-hint-color, #6b7280)" }
                  : undefined
              }
            >
              {time}
            </span>
          )}
        </div>
        <p
          className={cn(
            "truncate text-sm",
            variant !== "telegram" && "text-gray-500"
          )}
          style={
            variant === "telegram"
              ? { color: "var(--tg-theme-subtitle-text-color, #6b7280)" }
              : undefined
          }
        >
          {preview}
        </p>
      </div>
    </Link>
  );
}
