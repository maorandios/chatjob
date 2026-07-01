"use client";

import { getPostAuthManagerPath } from "@/lib/auth/post-auth-redirect";
import { resolveManagerIdByEmail } from "@/lib/auth/manager-auth";
import { waitForAuthSession } from "@/lib/auth/wait-for-auth-session";
import { resolveWorkerInviteTokenByEmail } from "@/lib/auth/worker-auth";
import { getStoredManagerId, setStoredManagerId } from "@/lib/manager-session";
import {
  getStoredWorkerInviteToken,
  setStoredWorkerInviteToken,
} from "@/lib/worker-session";
import { getWorkerJoinPath } from "@/lib/utils";

export type RestoredAppSession =
  | { kind: "manager"; managerId: string; path: string }
  | { kind: "worker"; path: string };

function isWorkerNotFound(error: unknown): boolean {
  return error instanceof Error && error.message.includes("לא נמצא עובד");
}

async function resolveManagerPostAuthPath(managerId: string): Promise<string> {
  const res = await fetch("/api/managers/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ managerId }),
  });

  if (!res.ok) {
    return getPostAuthManagerPath(true);
  }

  const data = await res.json().catch(() => ({}));
  const onboardingComplete = Boolean(data.manager?.onboardingComplete);
  return getPostAuthManagerPath(onboardingComplete);
}

export async function restoreAppSession(): Promise<RestoredAppSession | null> {
  const session = await waitForAuthSession();
  const email = session?.user?.email;

  if (email) {
    try {
      const { inviteToken } = await resolveWorkerInviteTokenByEmail(email);
      setStoredWorkerInviteToken(inviteToken);
      return { kind: "worker", path: getWorkerJoinPath(inviteToken) };
    } catch (error) {
      if (!isWorkerNotFound(error)) {
        console.warn("[Slang] Worker session restore lookup failed", error);
      }
    }

    try {
      const managerId = await resolveManagerIdByEmail(email);
      setStoredManagerId(managerId);
      const path = await resolveManagerPostAuthPath(managerId);
      return { kind: "manager", managerId, path };
    } catch (error) {
      console.warn("[Slang] Manager session restore lookup failed", error);
    }
  }

  const storedManagerId = getStoredManagerId();
  if (storedManagerId) {
    const path = await resolveManagerPostAuthPath(storedManagerId);
    return { kind: "manager", managerId: storedManagerId, path };
  }

  const storedWorkerToken = getStoredWorkerInviteToken();
  if (storedWorkerToken && session) {
    return { kind: "worker", path: getWorkerJoinPath(storedWorkerToken) };
  }

  return null;
}
