"use client";

import { UserSettingsButton } from "@/components/settings/UserSettingsButton";

type AppListHeaderProps = {
  title?: string;
  settingsHref: string;
};

export function AppListHeader({
  title = "Slang",
  settingsHref,
}: AppListHeaderProps) {
  return (
    <header className="chrome-top shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <UserSettingsButton href={settingsHref} />
      </div>
    </header>
  );
}
