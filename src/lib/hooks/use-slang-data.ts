"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { rowToMessage } from "@/lib/supabase/mappers";
import { useSlangStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function useMessagesRealtime(workerId: string | undefined) {
  const upsertMessage = useSlangStore((s) => s.upsertMessage);

  useEffect(() => {
    if (!workerId) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel(`messages:${workerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `worker_id=eq.${workerId}`,
        },
        (payload) => {
          upsertMessage(rowToMessage(payload.new as never));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `worker_id=eq.${workerId}`,
        },
        (payload) => {
          upsertMessage(rowToMessage(payload.new as never));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [workerId, upsertMessage]);
}

export function useChatData(workerId: string | undefined) {
  const loadMessages = useSlangStore((s) => s.loadMessages);

  useEffect(() => {
    if (!workerId) return;
    void loadMessages(workerId);
  }, [workerId, loadMessages]);

  useMessagesRealtime(workerId);
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
  };
}
