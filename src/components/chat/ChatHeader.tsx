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
  dir?: "ltr" | "rtl";
  showOnline?: boolean;
  onProfileClick?: () => void;
  settingsHref?: string;
};

function ProfileContent({
  name,
  subtitle,
  showOnline,
  isRtl,
}: {
  name: string;
  subtitle?: string;
  showOnline: boolean;
  isRtl: boolean;
}) {
  return (
    <>
      <Avatar name={name} size="sm" />
      <div className={cn("min-w-0", isRtl ? "text-right" : "text-left")}>
        <p className="truncate text-base font-semibold text-gray-900">{name}</p>
        {subtitle && (
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs text-gray-500",
              isRtl ? "justify-end" : "justify-start"
            )}
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
  dir = "rtl",
  showOnline = true,
  onProfileClick,
  settingsHref,
}: ChatHeaderProps) {
  const isRtl = dir === "rtl";

  const backButton = backHref ? (
    <Link
      href={backHref}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-[var(--jobchat-surface)]"
      aria-label="Back"
    >
      <ArrowLeft className={cn("h-5 w-5", !isRtl && "rotate-180")} />
    </Link>
  ) : (
    <div className="w-10 shrink-0" />
  );

  const profileInner = (
    <ProfileContent
      name={name}
      subtitle={subtitle}
      showOnline={showOnline}
      isRtl={isRtl}
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

  const profileWrapper = (
    <div
      className={cn(
        "flex min-w-0 flex-1",
        isRtl ? "justify-end" : "justify-start"
      )}
    >
      {profileBlock}
    </div>
  );

  const settingsButton = settingsHref ? (
    <UserSettingsButton href={settingsHref} className="h-10 w-10" />
  ) : (
    <div className="w-10 shrink-0" />
  );

  return (
    <header className="chrome-top z-20 shrink-0 border-b border-[var(--jobchat-border)] bg-white">
      <div dir="ltr" className="flex items-center gap-3 px-4 py-3">
        {isRtl ? (
          <>
            {backButton}
            {profileWrapper}
            {settingsButton}
          </>
        ) : (
          <>
            {settingsButton}
            {profileWrapper}
            {backButton}
          </>
        )}
      </div>
    </header>
  );
}
