"use client";

import { UserSettingsButton } from "@/components/settings/UserSettingsButton";
import Image from "next/image";

type AppListHeaderProps = {
  settingsHref: string;
  variant?: "default" | "en";
};

export function AppListHeader({
  settingsHref,
  variant = "default",
}: AppListHeaderProps) {
  const logoSrc = variant === "en" ? "/klinglogo-en.svg" : "/klinglogo.svg";

  return (
    <header className="chrome-top shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <Image
          src={logoSrc}
          alt="Kling"
          width={120}
          height={32}
          priority
          style={{ width: 120, height: "auto" }}
        />
        <UserSettingsButton href={settingsHref} />
      </div>
    </header>
  );
}
