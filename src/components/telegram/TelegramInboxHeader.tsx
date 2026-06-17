"use client";

import { UserSettingsButton } from "@/components/settings/UserSettingsButton";
import { cn } from "@/lib/utils";

type TelegramInboxHeaderProps = {
  title: string;
  subtitle?: string;
  dir?: "ltr" | "rtl";
  settingsHref?: string;
};

export function TelegramInboxHeader({
  title,
  subtitle,
  dir = "rtl",
  settingsHref,
}: TelegramInboxHeaderProps) {
  const isRtl = dir === "rtl";

  return (
    <header
      className="chrome-top z-20 shrink-0 border-b"
      style={{
        backgroundColor: "var(--tg-theme-header-bg-color, #ffffff)",
        borderColor: "var(--tg-theme-hint-color, var(--jobchat-border))",
        color: "var(--tg-theme-text-color, var(--foreground))",
      }}
    >
      <div
        dir="ltr"
        className={cn(
          "flex items-center gap-3 px-4 py-3",
          isRtl ? "flex-row" : "flex-row-reverse"
        )}
      >
        <div className={cn("min-w-0 flex-1", isRtl ? "text-right" : "text-left")}>
          <p className="truncate text-lg font-semibold">{title}</p>
          {subtitle && (
            <p className="truncate text-xs opacity-60">{subtitle}</p>
          )}
        </div>
        {settingsHref ? (
          <UserSettingsButton href={settingsHref} className="h-10 w-10 shrink-0" />
        ) : null}
      </div>
    </header>
  );
}
