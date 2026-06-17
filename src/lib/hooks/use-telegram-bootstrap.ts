"use client";

import { useTelegram } from "@/components/telegram/TelegramProvider";
import { useSlangStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function useTelegramBootstrap() {
  const { ready: telegramReady, isTelegram, session, error: telegramError } =
    useTelegram();
  const signInManager = useSlangStore((s) => s.signInManager);
  const bootstrapManager = useSlangStore((s) => s.bootstrapManager);
  const fetchInvite = useSlangStore((s) => s.fetchInvite);
  const storeReady = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const workers = useSlangStore((s) => s.workers);

  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    if (!telegramReady) return;

    if (!session || session.role === "unknown") {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (session.role === "manager" && session.managerId) {
          try {
            await signInManager(session.managerId);
          } catch {
            await bootstrapManager(undefined, session.managerId);
          }
        } else if (session.role === "worker" && session.inviteToken) {
          await fetchInvite(session.inviteToken);
        }
      } catch (err) {
        if (!cancelled) {
          setBootstrapError(
            err instanceof Error ? err.message : "Failed to load account"
          );
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    telegramReady,
    session,
    signInManager,
    bootstrapManager,
    fetchInvite,
  ]);

  const worker =
    session?.role === "worker" && session.workerId
      ? workers.find((w) => w.id === session.workerId)
      : session?.role === "worker" && session.inviteToken
        ? workers.find((w) => w.inviteToken === session.inviteToken)
        : undefined;

  const appReady =
    telegramReady &&
    !bootstrapping &&
    (session?.role === "unknown" ||
      (session?.role === "manager" && storeReady && Boolean(managerId)) ||
      (session?.role === "worker" && Boolean(worker)));

  return {
    isTelegram,
    session,
    appReady,
    worker,
    managerId,
    error: telegramError ?? bootstrapError,
  };
}
