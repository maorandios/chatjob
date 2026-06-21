"use client";

import { InstallAppBanner } from "@/components/ui/InstallAppBanner";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useSlangStore } from "@/lib/store";
import { isWorkerJoined } from "@/lib/workers/invite-status";
import type { LanguageCode } from "@/types";
import { usePathname } from "next/navigation";

function getInviteTokenFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "invite" && parts[0] !== "join") return null;
  return parts[1] ?? null;
}

export function AuthenticatedInstallBanner() {
  const pathname = usePathname() ?? "";
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);
  const workers = useSlangStore((s) => s.workers);

  if (pathname.startsWith("/manager") || pathname.startsWith("/c/")) {
    if (!ready || !managerId || !onboardingComplete) return null;

    return (
      <InstallAppBanner
        text="עבור חווית שימוש מיטבית, התקינו את קלינג"
        actionLabel="התקנה"
        dir="rtl"
      />
    );
  }

  const token = getInviteTokenFromPath(pathname);
  if (!token) return null;

  const worker = workers.find((candidate) => candidate.inviteToken === token);
  if (!worker?.language || !isWorkerJoined(worker)) return null;

  const language = worker.language as LanguageCode;
  const ui = getWorkerUi(language);

  return (
    <InstallAppBanner
      text={ui.installBannerText}
      actionLabel={ui.installBannerAction}
      dir={getLanguageDir(language)}
    />
  );
}
