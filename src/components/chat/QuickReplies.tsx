"use client";

import { cn } from "@/lib/utils";

type QuickRepliesProps = {
  replies: string[];
  onSelect: (text: string) => void;
  variant?: "default" | "telegram";
};

export function QuickReplies({
  replies,
  onSelect,
  variant = "default",
}: QuickRepliesProps) {
  const isTelegram = variant === "telegram";

  return (
    <div
      className={cn(
        "shrink-0 border-t px-4 py-3",
        !isTelegram && "border-[var(--jobchat-border)] bg-white"
      )}
      style={
        isTelegram
          ? {
              borderColor: "var(--tg-theme-hint-color, var(--jobchat-border))",
              backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
            }
          : undefined
      }
    >
      <div className="flex flex-wrap justify-center gap-2">
        {replies.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => onSelect(reply)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors active:opacity-80",
              !isTelegram &&
                "border border-[var(--jobchat-accent)]/25 bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)] hover:bg-[var(--jobchat-accent)]/10"
            )}
            style={
              isTelegram
                ? {
                    backgroundColor:
                      "var(--tg-theme-secondary-bg-color, var(--jobchat-surface))",
                    color: "var(--tg-theme-link-color, var(--jobchat-accent))",
                  }
                : undefined
            }
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
