"use client";

import { normalizeEmail } from "@/lib/auth/email";
import { mapSupabaseAuthError } from "@/lib/auth/map-auth-error";
import { resetAuthSessionCache } from "@/lib/auth/wait-for-auth-session";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const EMAIL_OTP_VERIFY_TYPES = ["email", "magiclink", "signup"] as const;

export async function resolveManagerIdByEmail(email: string): Promise<string> {
  const res = await fetch("/api/auth/resolve-manager", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "לא ניתן להשלים את ההרשמה. נסו שוב."
    );
  }

  if (typeof data.managerId !== "string" || !data.managerId) {
    throw new Error("לא ניתן להשלים את ההרשמה. נסו שוב.");
  }

  return data.managerId;
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("התחברות אינה מוגדרת בשרת");
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedToken = token.trim();
  let lastMessage = "הקוד שגוי או שפג תוקפו — נסו שוב";

  for (const type of EMAIL_OTP_VERIFY_TYPES) {
    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type,
    });

    if (!error) return;

    lastMessage = error.message;
  }

  throw new Error(mapSupabaseAuthError(lastMessage));
}

export async function verifyEmailOtpFromHash(
  tokenHash: string,
  type: "email" | "magiclink" = "email"
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("התחברות אינה מוגדרת בשרת");
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    throw new Error(mapSupabaseAuthError(error.message));
  }
}

export async function exchangeAuthCodeForSession(code: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("התחברות אינה מוגדרת בשרת");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    throw new Error(mapSupabaseAuthError(error.message));
  }
}

export async function getAuthenticatedEmail(): Promise<string> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("התחברות אינה מוגדרת בשרת");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  const email = session?.user?.email;
  if (!email) {
    throw new Error("לא נמצאה התחברות פעילה");
  }

  return email;
}

export async function getSupabaseAccessToken(): Promise<string> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("התחברות אינה מוגדרת בשרת");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session?.access_token) {
    throw new Error("לא נמצאה התחברות פעילה");
  }

  return session.access_token;
}

export async function acceptManagerInviteByToken(
  inviteToken: string
): Promise<string> {
  const accessToken = await getSupabaseAccessToken();
  const res = await fetch(
    `/api/managers/invite/${encodeURIComponent(inviteToken)}/accept`,
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

  if (typeof data.managerId !== "string" || !data.managerId) {
    throw new Error("לא ניתן להשלים את ההצטרפות");
  }

  return data.managerId;
}

export async function validateInviteEmailForJoin(
  inviteToken: string,
  email: string
): Promise<void> {
  const res = await fetch(
    `/api/managers/invite/${encodeURIComponent(inviteToken)}/validate-email`,
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

export async function signOutSupabaseAuth(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase.auth.signOut();
  resetAuthSessionCache();
}
