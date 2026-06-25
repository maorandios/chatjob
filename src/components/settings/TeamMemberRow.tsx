"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Send, Trash2 } from "lucide-react";

const actionButtonClassName =
  "flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-gray-400 active:bg-gray-100 active:text-gray-600";

type TeamMemberRowProps = {
  name: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  onPress?: () => void;
  canRemove?: boolean;
  onRemove?: () => void;
  pendingInvite?: boolean;
  onSendInvite?: () => void;
  mutedAvatar?: boolean;
};

export function TeamMemberRow({
  name,
  phone,
  email,
  imageUrl,
  onPress,
  canRemove,
  onRemove,
  pendingInvite,
  onSendInvite,
  mutedAvatar,
}: TeamMemberRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--jobchat-border)] bg-white/25 px-3 py-2.5">
      <Avatar
        name={name}
        size="sm"
        imageUrl={imageUrl}
        className={mutedAvatar ? "bg-gray-200 text-gray-500" : undefined}
      />
      <button
        type="button"
        onClick={onPress}
        className="min-w-0 flex-1 text-start active:opacity-70"
      >
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        {phone && (
          <p className="block w-full truncate text-end text-xs text-gray-500" dir="ltr">
            {phone}
          </p>
        )}
        {email && (
          <p className="block w-full truncate text-end text-xs text-gray-400" dir="ltr">
            {email}
          </p>
        )}
      </button>
      <div className="flex shrink-0 items-center">
        {pendingInvite && onSendInvite && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSendInvite();
            }}
            className={`${actionButtonClassName} text-[var(--jobchat-accent)] active:text-[var(--jobchat-accent)]`}
            aria-label="שלח קישור"
          >
            <Send className="h-4 w-4 shrink-0" />
          </button>
        )}
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className={actionButtonClassName}
            aria-label="הסרה"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
