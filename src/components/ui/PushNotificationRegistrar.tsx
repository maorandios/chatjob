"use client";

import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { useSlangStore } from "@/lib/store";
import { isWorkerJoined } from "@/lib/workers/invite-status";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

function getInviteTokenFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "invite" && parts[0] !== "join") return null;
  return parts[1] ?? null;
}

export function PushNotificationRegistrar() {
  const pathname = usePathname() ?? "";
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);
  const workers = useSlangStore((s) => s.workers);

  const pushTarget = useMemo(() => {
    if ((pathname.startsWith("/manager") || pathname.startsWith("/c/")) && managerId) {
      if (!ready || !onboardingComplete) return null;
      return { userRole: "manager" as const, userId: managerId };
    }

    const token = getInviteTokenFromPath(pathname);
    if (!token) return null;

    const worker = workers.find((candidate) => candidate.inviteToken === token);
    if (!worker || !isWorkerJoined(worker)) return null;

    return { userRole: "worker" as const, userId: worker.id };
  }, [managerId, onboardingComplete, pathname, ready, workers]);

  const { state, requestPermissionAndSubscribe } = usePushNotifications({
    enabled: Boolean(pushTarget),
    userRole: pushTarget?.userRole,
    userId: pushTarget?.userId,
  });

  if (!pushTarget || state !== "default") return null;

  return (
    <button
      type="button"
      onClick={() => void requestPermissionAndSubscribe()}
      className="fixed left-1/2 top-3 z-[80] -translate-x-1/2 rounded-full border border-[var(--jobchat-accent)] bg-[var(--jobchat-accent-light)] px-4 py-2 text-sm font-semibold text-[var(--jobchat-accent)] shadow-sm active:scale-[0.98]"
    >
      אפשר התראות
    </button>
  );
}

