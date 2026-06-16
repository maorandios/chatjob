"use client";

import { normalizeEmail } from "@/lib/auth/email";
import { mapSupabaseAuthError } from "@/lib/auth/map-auth-error";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export async function sendManagerLoginOtp(email: string): Promise<void> {
  const normalized = normalizeEmail(email);

  const checkRes = await fetch("/api/auth/magic-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalized }),
  });

  const checkData = await checkRes.json().catch(() => ({}));
  if (!checkRes.ok) {
    throw new Error(
      typeof checkData.error === "string"
        ? checkData.error
        : "לא ניתן לשלוח את קוד האימות"
    );
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("Supabase לא מוגדר באפליקציה (NEXT_PUBLIC_SUPABASE_*)");
  }

  // No emailRedirectTo — Supabase uses dashboard email templates ({{ .Token }} for OTP).
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw new Error(mapSupabaseAuthError(error.message));
  }
}
