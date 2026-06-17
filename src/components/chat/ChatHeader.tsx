"use client";

import { Avatar } from "@/components/ui/Avatar";
import { UserSettingsButton } from "@/components/settings/UserSettingsButton";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type ChatHeaderProps = {
  name: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  dir?: "ltr" | "rtl";
  showOnline?: boolean;
  onProfileClick?: () => void;
  settingsHref?: string;
  variant?: "default" | "telegram";
};

function ProfileContent({
  name,
  subtitle,
  showOnline,
  isRtl,
  variant,
}: {
  name: string;
  subtitle?: string;
  showOnline: boolean;
  isRtl: boolean;
  variant: "default" | "telegram";
}) {
  const isTelegram = variant === "telegram";
  const nameStyle = isTelegram
    ? { color: "var(--tg-theme-text-color, #111827)" }
    : undefined;
  const subtitleStyle = isTelegram
    ? { color: "var(--tg-theme-subtitle-text-color, #6b7280)" }
    : undefined;

  return (
    <>
      <Avatar name={name} size="sm" />
      <div className={cn("min-w-0", isRtl ? "text-right" : "text-left")}>
        <p className="truncate text-base font-semibold" style={nameStyle}>
          {name}
        </p>
        {subtitle && (
          <p
            className={cn(
              "flex items-center gap-1.5 truncate text-xs",
              isRtl ? "justify-end" : "justify-start",
              !nameStyle && "text-gray-500"
            )}
            style={subtitleStyle}
          >
            {showOnline && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--jobchat-accent)]" />
            )}
            <span className="truncate">{subtitle}</span>
          </p>
        )}
      </div>
    </>
  );
}

export function ChatHeader({
  name,
  subtitle,
  backHref,
  onBack,
  dir = "rtl",
  showOnline = true,
  onProfileClick,
  settingsHref,
  variant = "default",
}: ChatHeaderProps) {
  const isRtl = dir === "rtl";
  const isTelegram = variant === "telegram";
  const backBtnClass = cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
    !isTelegram && "text-gray-700 hover:bg-[var(--jobchat-surface)]"
  );
  const backBtnStyle = isTelegram
    ? { color: "var(--tg-theme-link-color, #3390ec)" }
    : undefined;
  const backIconClass = cn("h-5 w-5", !isRtl && "rotate-180");

  const backButton =
    backHref || onBack ? (
      backHref ? (
        <Link
          href={backHref}
          className={backBtnClass}
          style={backBtnStyle}
          aria-label="Back"
        >
          <ArrowLeft className={backIconClass} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className={backBtnClass}
          style={backBtnStyle}
          aria-label="Back"
        >
          <ArrowLeft className={backIconClass} />
        </button>
      )
    ) : (
      <div className="w-10 shrink-0" />
    );

  const profileInner = (
    <ProfileContent
      name={name}
      subtitle={subtitle}
      showOnline={showOnline}
      isRtl={isRtl}
      variant={variant}
    />
  );

  const profileBlock: ReactNode = onProfileClick ? (
    <button
      type="button"
      onClick={onProfileClick}
      dir={dir}
      className="flex cursor-pointer items-center gap-3 rounded-2xl transition-colors hover:opacity-90 active:opacity-80"
    >
      {profileInner}
    </button>
  ) : (
    <div dir={dir} className="flex items-center gap-3">
      {profileInner}
    </div>
  );

  const settingsButton = settingsHref ? (
    <UserSettingsButton href={settingsHref} className="h-10 w-10 shrink-0" />
  ) : null;

  return (
    <header
      className={cn(
        "chrome-top z-20 shrink-0 border-b",
        variant === "default" &&
          "border-[var(--jobchat-border)] bg-white"
      )}
      style={
        variant === "telegram"
          ? {
              backgroundColor: "var(--tg-theme-header-bg-color, #ffffff)",
              borderColor: "var(--tg-theme-hint-color, var(--jobchat-border))",
              color: "var(--tg-theme-text-color, var(--foreground))",
            }
          : undefined
      }
    >
      <div dir="ltr" className="flex items-center gap-3 px-4 py-3">
        {isRtl ? (
          <>
            {backButton}
            <div className="ms-auto min-w-0">{profileBlock}</div>
            {settingsHref ? settingsButton : null}
          </>
        ) : (
          <>
            <div className="min-w-0">{profileBlock}</div>
            <div className="ms-auto" />
            {settingsHref ? settingsButton : null}
            {backButton}
          </>
        )}
      </div>
    </header>
  );
}
