"use client";

import { normalizeEmail } from "@/lib/auth/email";
import { getSupabaseAccessToken } from "@/lib/auth/manager-auth";

export async function resolveWorkerInviteTokenByEmail(email: string): Promise<{
  workerId: string;
  inviteToken: string;
}> {
  const res = await fetch("/api/auth/resolve-worker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "לא ניתן להשלים את ההתחברות"
    );
  }

  if (data.found === false) {
    throw new Error("לא נמצא עובד עם כתובת המייל הזאת");
  }

  if (
    typeof data.inviteToken !== "string" ||
    !data.inviteToken ||
    typeof data.workerId !== "string" ||
    !data.workerId
  ) {
    throw new Error("לא ניתן להשלים את ההתחברות");
  }

  return { workerId: data.workerId, inviteToken: data.inviteToken };
}

export async function validateWorkerInviteEmailForJoin(
  inviteToken: string,
  email: string
): Promise<void> {
  const res = await fetch(
    `/api/workers/invite/${encodeURIComponent(inviteToken)}/validate-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizeEmail(email) }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "לא ניתן לבדוק את כתובת המייל"
    );
  }
}

export async function acceptWorkerInviteByToken(
  inviteToken: string
): Promise<string> {
  const accessToken = await getSupabaseAccessToken();

  const res = await fetch(
    `/api/workers/invite/${encodeURIComponent(inviteToken)}/accept`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "לא ניתן להשלים את ההצטרפות"
    );
  }

  if (typeof data.workerId !== "string" || !data.workerId) {
    throw new Error("לא ניתן להשלים את ההצטרפות");
  }

  return data.workerId;
}
