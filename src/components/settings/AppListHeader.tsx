"use client";

import { UserSettingsButton } from "@/components/settings/UserSettingsButton";
import Image from "next/image";

type AppListHeaderProps = {
  settingsHref: string;
};

export function AppListHeader({ settingsHref }: AppListHeaderProps) {
  return (
    <header className="chrome-top shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <Image
          src="/app-logo.svg"
          alt="Kling"
          width={120}
          height={32}
          priority
          style={{ width: "auto", height: 32 }}
        />
        <UserSettingsButton href={settingsHref} />
      </div>
    </header>
  );
}
