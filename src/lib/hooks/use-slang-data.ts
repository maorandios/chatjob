"use client";

import { MESSAGE_PAGE_SIZE } from "@/lib/constants/limits";
import {
  subscribeToConversationMessages,
  subscribeToManagerInbox,
  subscribeToWorkerInbox,
} from "@/lib/supabase/messages-realtime";
import { subscribeToCompanyWorkers } from "@/lib/supabase/workers-realtime";
import { useVisibilityPoll } from "@/lib/hooks/use-visibility-poll";
import { useSlangStore } from "@/lib/store";
import { useCallback, useEffect, useRef, useState } from "react";

type ConversationSessionCache = {
  initialLoaded: boolean;
  hasMore: boolean;
  oldestCursor: string | null;
};

const conversationSessionCache = new Map<string, ConversationSessionCache>();

function conversationSessionKey(managerId: string, workerId: string): string {
  return `${managerId}:${workerId}`;
}

function getConversationSession(
  managerId: string,
  workerId: string
): ConversationSessionCache | undefined {
  return conversationSessionCache.get(
    conversationSessionKey(managerId, workerId)
  );
}

function setConversationSession(
  managerId: string,
  workerId: string,
  session: ConversationSessionCache
): void {
  conversationSessionCache.set(
    conversationSessionKey(managerId, workerId),
    session
  );
}

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
  workerId: string | undefined,
  viewerRole: "manager" | "worker" = "manager"
) {
  const loadMessages = useSlangStore((s) => s.loadMessages);
  const setConversationMessages = useSlangStore((s) => s.setConversationMessages);
  const mergeMessages = useSlangStore((s) => s.mergeMessages);
  const mergeRef = useRef(mergeMessages);
  mergeRef.current = mergeMessages;

  const cachedSession =
    managerId && workerId
      ? getConversationSession(managerId, workerId)
      : undefined;

  const [loading, setLoading] = useState(
    Boolean(managerId && workerId && !cachedSession?.initialLoaded)
  );
  const [hasMore, setHasMore] = useState(cachedSession?.hasMore ?? false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const oldestCursorRef = useRef<string | null>(
    cachedSession?.oldestCursor ?? null
  );

  useEffect(() => {
    if (!managerId || !workerId) {
      setLoading(false);
      setHasMore(false);
      oldestCursorRef.current = null;
      return;
    }

    const cached = getConversationSession(managerId, workerId);
    if (cached?.initialLoaded) {
      setLoading(false);
      setHasMore(cached.hasMore);
      oldestCursorRef.current = cached.oldestCursor;
      return;
    }

    let cancelled = false;
    setLoading(true);
    setHasMore(false);
    oldestCursorRef.current = null;

    void loadMessages(managerId, workerId, {
      limit: MESSAGE_PAGE_SIZE,
      viewerRole,
    })
      .then(({ messages, hasMore: more }) => {
        if (cancelled) return;
        setConversationMessages(managerId, workerId, messages);
        const oldestCursor = messages[0]?.createdAt ?? null;
        oldestCursorRef.current = oldestCursor;
        setConversationSession(managerId, workerId, {
          initialLoaded: true,
          hasMore: more,
          oldestCursor,
        });
        setHasMore(more);
      })
      .catch((error) => {
        console.error("[Slang] Failed to load messages", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [managerId, workerId, viewerRole, loadMessages, setConversationMessages]);

  const loadOlder = useCallback(async () => {
    if (!managerId || !workerId || !hasMore || loadingOlder) return;
    if (!oldestCursorRef.current) return;

    setLoadingOlder(true);
    try {
      const { messages, hasMore: more } = await loadMessages(
        managerId,
        workerId,
        {
          limit: MESSAGE_PAGE_SIZE,
          before: oldestCursorRef.current,
          viewerRole,
        }
      );

      if (messages.length > 0) {
        mergeMessages(messages);
        oldestCursorRef.current = messages[0]!.createdAt;
      }

      const nextHasMore = more && messages.length > 0;
      setHasMore(nextHasMore);
      setConversationSession(managerId, workerId, {
        initialLoaded: true,
        hasMore: nextHasMore,
        oldestCursor: oldestCursorRef.current,
      });
    } catch (error) {
      console.error("[Slang] Failed to load older messages", error);
    } finally {
      setLoadingOlder(false);
    }
  }, [
    managerId,
    workerId,
    viewerRole,
    hasMore,
    loadingOlder,
    loadMessages,
    mergeMessages,
  ]);

  useMessagesRealtime(managerId, workerId);

  useVisibilityPoll(
    () => {
      if (!managerId || !workerId) return;
      void loadMessages(managerId, workerId, {
        limit: MESSAGE_PAGE_SIZE,
        viewerRole,
      })
        .then(({ messages }) => {
          if (messages.length > 0) {
            mergeRef.current(messages);
          }
        })
        .catch((error) => {
          console.error("[Slang] Failed to sync messages", error);
        });
    },
    Boolean(managerId && workerId),
    5_000
  );

  return { loading, hasMore, loadingOlder, loadOlder };
}

export function useManagerBootstrap() {
  const ready = useSlangStore((s) => s.ready);
  const loggedOut = useSlangStore((s) => s.loggedOut);
  const bootstrapManager = useSlangStore((s) => s.bootstrapManager);

  useEffect(() => {
    if (ready || loggedOut) return;
    void bootstrapManager().catch((error) => {
      console.error("[Slang] Manager bootstrap failed", error);
    });
  }, [ready, loggedOut, bootstrapManager]);
}

export function useManagerInboxPreviews() {
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const companyId = useSlangStore((s) => s.companyId);
  const loadMessagePreviews = useSlangStore((s) => s.loadMessagePreviews);
  const loadWorkers = useSlangStore((s) => s.loadWorkers);
  const upsertMessage = useSlangStore((s) => s.upsertMessage);
  const upsertWorker = useSlangStore((s) => s.upsertWorker);
  const upsertRef = useRef(upsertMessage);
  const upsertWorkerRef = useRef(upsertWorker);
  upsertRef.current = upsertMessage;
  upsertWorkerRef.current = upsertWorker;

  const refreshInbox = useCallback(() => {
    if (!managerId) return;
    void loadMessagePreviews({ managerId });
    void loadWorkers();
  }, [managerId, loadMessagePreviews, loadWorkers]);

  useEffect(() => {
    if (!ready || !managerId) return;

    refreshInbox();

    const unsubMessages = subscribeToManagerInbox(managerId, (message) => {
      upsertRef.current(message);
      void loadMessagePreviews({ managerId });
    });

    const unsubWorkers = companyId
      ? subscribeToCompanyWorkers(companyId, (worker) => {
          upsertWorkerRef.current(worker);
        })
      : () => {};

    return () => {
      unsubMessages();
      unsubWorkers();
    };
  }, [ready, managerId, companyId, loadMessagePreviews, refreshInbox]);

  useVisibilityPoll(refreshInbox, ready && Boolean(managerId), 3_000);
}

export function useWorkerInboxPreviews(workerId: string | undefined) {
  const loadMessagePreviews = useSlangStore((s) => s.loadMessagePreviews);
  const upsertMessage = useSlangStore((s) => s.upsertMessage);
  const upsertRef = useRef(upsertMessage);
  upsertRef.current = upsertMessage;

  const refreshInbox = useCallback(() => {
    if (!workerId) return;
    void loadMessagePreviews({ workerId });
  }, [workerId, loadMessagePreviews]);

  useEffect(() => {
    if (!workerId) return;

    refreshInbox();

    return subscribeToWorkerInbox(workerId, (message) => {
      upsertRef.current(message);
      void loadMessagePreviews({ workerId });
    });
  }, [workerId, loadMessagePreviews, refreshInbox]);

  useVisibilityPoll(refreshInbox, Boolean(workerId), 3_000);
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
  const [authRequired, setAuthRequired] = useState(false);
  const fetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const joinedWorker = worker?.status === "active" && Boolean(worker.email);
    if (worker && invite && !joinedWorker) {
      setFetchState("done");
      return;
    }
    if (worker && invite && fetchedTokenRef.current === token) {
      setFetchState("done");
      return;
    }

    let cancelled = false;
    setAuthRequired(false);
    setFetchState("loading");
    fetchedTokenRef.current = token;

    void fetchInvite(token)
      .catch((error) => {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "WORKER_AUTH_REQUIRED"
        ) {
          if (!cancelled) setAuthRequired(true);
          return;
        }
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
    loading:
      Boolean(token) &&
      (fetchState === "loading" ||
        (fetchState === "idle" && (!worker || !invite))),
    worker,
    invite,
    managers,
    authRequired,
  };
}
