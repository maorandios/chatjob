"use client";

import { MESSAGE_PAGE_SIZE } from "@/lib/constants/limits";
import {
  subscribeToConversationMessages,
  subscribeToManagerInbox,
  subscribeToWorkerInbox,
} from "@/lib/supabase/messages-realtime";
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
  workerId: string | undefined
) {
  const loadMessages = useSlangStore((s) => s.loadMessages);
  const setConversationMessages = useSlangStore((s) => s.setConversationMessages);
  const mergeMessages = useSlangStore((s) => s.mergeMessages);

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

    void loadMessages(managerId, workerId, { limit: MESSAGE_PAGE_SIZE })
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
  }, [managerId, workerId, loadMessages, setConversationMessages]);

  const loadOlder = useCallback(async () => {
    if (!managerId || !workerId || !hasMore || loadingOlder) return;
    if (!oldestCursorRef.current) return;

    setLoadingOlder(true);
    try {
      const { messages, hasMore: more } = await loadMessages(managerId, workerId, {
        limit: MESSAGE_PAGE_SIZE,
        before: oldestCursorRef.current,
      });

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
    hasMore,
    loadingOlder,
    loadMessages,
    mergeMessages,
  ]);

  useMessagesRealtime(managerId, workerId);

  return { loading, hasMore, loadingOlder, loadOlder };
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

export function useManagerInboxPreviews() {
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const loadMessagePreviews = useSlangStore((s) => s.loadMessagePreviews);
  const upsertMessage = useSlangStore((s) => s.upsertMessage);
  const upsertRef = useRef(upsertMessage);
  upsertRef.current = upsertMessage;

  useEffect(() => {
    if (!ready || !managerId) return;

    void loadMessagePreviews({ managerId });

    return subscribeToManagerInbox(managerId, (message) => {
      upsertRef.current(message);
    });
  }, [ready, managerId, loadMessagePreviews]);
}

export function useWorkerInboxPreviews(workerId: string | undefined) {
  const loadMessagePreviews = useSlangStore((s) => s.loadMessagePreviews);
  const upsertMessage = useSlangStore((s) => s.upsertMessage);
  const upsertRef = useRef(upsertMessage);
  upsertRef.current = upsertMessage;

  useEffect(() => {
    if (!workerId) return;

    void loadMessagePreviews({ workerId });

    return subscribeToWorkerInbox(workerId, (message) => {
      upsertRef.current(message);
    });
  }, [workerId, loadMessagePreviews]);
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
