"use client";

import { subscribeToConversationMessages } from "@/lib/supabase/messages-realtime";
import { useSlangStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

export function useMessagesRealtime(
  managerId: string | undefined,
  workerId: string | undefined
) {
  const upsertMessage = useSlangStore((s) => s.upsertMessage);
  const upsertRef = useRef(upsertMessage);
  upsertRef.current = upsertMessage;

  useEffect(() => {
    if (!managerId || !workerId) return;

    return subscribeToConversationMessages(managerId, workerId, (message) => {
      upsertRef.current(message);
    });
  }, [managerId, workerId]);
}

export function useChatData(
  managerId: string | undefined,
  workerId: string | undefined
) {
  useEffect(() => {
    if (!managerId || !workerId) return;
    void useSlangStore.getState().loadMessages(managerId, workerId);
  }, [managerId, workerId]);

  useMessagesRealtime(managerId, workerId);
}

export function useManagerBootstrap() {
  const ready = useSlangStore((s) => s.ready);
  const bootstrapManager = useSlangStore((s) => s.bootstrapManager);

  useEffect(() => {
    if (ready) return;
    void bootstrapManager().catch((error) => {
      console.error("[Slang] Manager bootstrap failed", error);
    });
  }, [ready, bootstrapManager]);
}

export function useInviteBootstrap(token: string | undefined) {
  const fetchInvite = useSlangStore((s) => s.fetchInvite);
  const worker = useSlangStore((s) =>
    token ? s.workers.find((w) => w.inviteToken === token) : undefined
  );
  const invite = useSlangStore((s) =>
    token ? s.invites.find((i) => i.token === token) : undefined
  );
  const managers = useSlangStore((s) => s.managers);
  const [fetchState, setFetchState] = useState<
    "idle" | "loading" | "done"
  >("idle");

  useEffect(() => {
    if (!token) return;
    if (worker && invite) {
      setFetchState("done");
      return;
    }

    let cancelled = false;
    setFetchState("loading");

    void fetchInvite(token)
      .catch((error) => {
        console.error("[Slang] Invite fetch failed", error);
      })
      .finally(() => {
        if (!cancelled) setFetchState("done");
      });

    return () => {
      cancelled = true;
    };
  }, [token, worker, invite, fetchInvite]);

  return {
    loading: Boolean(token) && fetchState === "loading",
    worker,
    invite,
    managers,
  };
}
