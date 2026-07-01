"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Session } from "@supabase/supabase-js";

let sessionReadyPromise: Promise<Session | null> | null = null;

function loadAuthSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      resolve(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "SIGNED_OUT"
      ) {
        subscription.unsubscribe();
        finish(session);
      }
    });

    window.setTimeout(() => {
      subscription.unsubscribe();
      void supabase.auth.getSession().then(({ data }) => finish(data.session));
    }, 2500);
  });
}

export function waitForAuthSession(): Promise<Session | null> {
  if (!sessionReadyPromise) {
    sessionReadyPromise = loadAuthSession();
  }
  return sessionReadyPromise;
}

export async function ensureAuthReady(): Promise<void> {
  await waitForAuthSession();
}

export function resetAuthSessionCache(): void {
  sessionReadyPromise = null;
}
