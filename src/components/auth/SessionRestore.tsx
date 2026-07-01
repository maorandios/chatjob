"use client";

import { restoreAppSession } from "@/lib/auth/restore-app-session";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { AppShell } from "@/components/ui/AppShell";
import { useSlangStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionRestoreProps = {
  children: React.ReactNode;
};

export function SessionRestore({ children }: SessionRestoreProps) {
  const router = useRouter();
  const loggedOut = useSlangStore((s) => s.loggedOut);
  const signInManager = useSlangStore((s) => s.signInManager);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loggedOut) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const restored = await restoreAppSession();
        if (cancelled) return;
        if (!restored) {
          setChecking(false);
          return;
        }

        if (restored.kind === "worker") {
          router.replace(restored.path);
          return;
        }

        await signInManager(restored.managerId);
        if (cancelled) return;
        router.replace(restored.path);
      } catch (error) {
        console.warn("[Slang] Session restore failed", error);
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loggedOut, router, signInManager]);

  if (checking && !loggedOut) {
    return (
      <AppShell dir="rtl">
        <AppLoadingState />
      </AppShell>
    );
  }

  return children;
}
