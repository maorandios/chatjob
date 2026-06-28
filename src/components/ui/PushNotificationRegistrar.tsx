"use client";

import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { useSlangStore } from "@/lib/store";
import { isWorkerJoined } from "@/lib/workers/invite-status";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

function getInviteTokenFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "invite" && parts[0] !== "join") return null;
  return parts[1] ?? null;
}

function isMobileRuntime(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function PushNotificationRegistrar() {
  const pathname = usePathname() ?? "";
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);
  const workers = useSlangStore((s) => s.workers);
  const [isMobile] = useState(isMobileRuntime);

  const pushTarget = useMemo(() => {
    if (!ready || !isMobile) return null;

    if ((pathname.startsWith("/manager") || pathname.startsWith("/c/")) && managerId) {
      if (!onboardingComplete) return null;
      return { userRole: "manager" as const, userId: managerId };
    }

    const token = getInviteTokenFromPath(pathname);
    if (!token) return null;

    const worker = workers.find((candidate) => candidate.inviteToken === token);
    if (!worker || !isWorkerJoined(worker)) return null;

    return { userRole: "worker" as const, userId: worker.id };
  }, [isMobile, managerId, onboardingComplete, pathname, ready, workers]);

  usePushNotifications({
    enabled: Boolean(pushTarget),
    userRole: pushTarget?.userRole,
    userId: pushTarget?.userId,
  });

  return null;
}

