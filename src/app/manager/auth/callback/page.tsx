"use client";

import { AppShell } from "@/components/ui/AppShell";
import {
  exchangeAuthCodeForSession,
  getAuthenticatedEmail,
  resolveManagerIdByEmail,
  verifyEmailOtpFromHash,
} from "@/lib/auth/manager-auth";
import { getPostAuthManagerPath } from "@/lib/auth/post-auth-redirect";
import { useSlangStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManagerAuthCallbackPage() {
  const router = useRouter();
  const signInManager = useSlangStore((s) => s.signInManager);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (code) {
          await exchangeAuthCodeForSession(code);
        } else if (tokenHash) {
          const otpType =
            type === "magiclink" || type === "signup"
              ? "magiclink"
              : "email";
          await verifyEmailOtpFromHash(
            tokenHash,
            otpType as "email" | "magiclink"
          );
        }

        const authEmail = await getAuthenticatedEmail();
        const managerId = await resolveManagerIdByEmail(authEmail);
        if (cancelled) return;

        await signInManager(managerId);
        const { onboardingComplete } = useSlangStore.getState();
        router.replace(getPostAuthManagerPath(onboardingComplete));
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "ההתחברות נכשלה"
        );
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router, signInManager]);

  return (
    <AppShell dir="rtl">
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] px-8 text-center">
        {error ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              לא ניתן להתחבר
            </h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <Link
              href="/login"
              className="mt-6 rounded-xl bg-[var(--jobchat-accent)] px-6 py-3 text-sm font-medium text-white"
            >
              חזרה להתחברות
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-[var(--jobchat-accent)]" />
            <p className="mt-4 text-sm text-gray-500">מתחברים...</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
