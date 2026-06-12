"use client";

import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Check, CheckCheck, Loader2, Mic } from "lucide-react";

type MessageBubbleProps = {
  message: Message;
  displayText: string;
  isOwn: boolean;
  translationCaption?: string;
  showStatus?: boolean;
};

export function MessageBubble({
  message,
  displayText,
  isOwn,
  translationCaption,
  showStatus = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[82%]", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm",
            isOwn
              ? "rounded-br-md bg-[#DCF8C6] text-gray-900"
              : "rounded-bl-md bg-white text-gray-900"
          )}
        >
          <div className="flex items-start gap-1.5">
            {message.inputType === "voice" && (
              <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
            )}
            <p className="whitespace-pre-wrap break-words">{displayText}</p>
          </div>
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px] text-gray-500",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <span>{formatTime(message.createdAt)}</span>
            {showStatus && isOwn && (
              <span className="text-[#53BDEB]">
                {message.status === "sending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : message.status === "delivered" ? (
                  <CheckCheck className="h-3.5 w-3.5" />
                ) : message.status === "failed" ? (
                  <span className="text-red-400">!</span>
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
        {translationCaption && !isOwn && (
          <p className="mt-1 px-1 text-[11px] text-gray-400">
            {translationCaption}
          </p>
        )}
      </div>
    </div>
  );
}
