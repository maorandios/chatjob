import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { rowToMessage } from "@/lib/supabase/mappers";
import type { Message } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Listener = (message: Message) => void;

type ConversationSubscription = {
  channel: RealtimeChannel;
  listeners: Set<Listener>;
};

const subscriptions = new Map<string, ConversationSubscription>();

function conversationKey(managerId: string, workerId: string): string {
  return `${managerId}:${workerId}`;
}

function createConversationChannel(
  managerId: string,
  workerId: string
): RealtimeChannel | null {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const channelName = `messages:${managerId}:${workerId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `manager_id=eq.${managerId}`,
      },
      (payload) => {
        if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
          return;
        }
        if (!payload.new) return;

        const row = payload.new as { worker_id?: string };
        if (row.worker_id !== workerId) return;

        const message = rowToMessage(payload.new as never);
        const key = conversationKey(managerId, workerId);
        const sub = subscriptions.get(key);
        if (!sub) return;

        for (const listener of sub.listeners) {
          listener(message);
        }
      }
    )
    .subscribe();
}

export function subscribeToConversationMessages(
  managerId: string,
  workerId: string,
  listener: Listener
): () => void {
  const key = conversationKey(managerId, workerId);
  let sub = subscriptions.get(key);

  if (!sub) {
    const channel = createConversationChannel(managerId, workerId);
    if (!channel) return () => {};

    sub = {
      channel,
      listeners: new Set(),
    };
    subscriptions.set(key, sub);
  }

  sub.listeners.add(listener);

  return () => {
    const current = subscriptions.get(key);
    if (!current) return;

    current.listeners.delete(listener);
    if (current.listeners.size > 0) return;

    subscriptions.delete(key);
    const supabase = getSupabaseBrowser();
    if (supabase) {
      void supabase.removeChannel(current.channel);
    }
  };
}

/** @deprecated Use subscribeToConversationMessages */
export function subscribeToWorkerMessages(
  workerId: string,
  listener: Listener
): () => void {
  return subscribeToConversationMessages("", workerId, listener);
}

const inboxSubscriptions = new Map<string, ConversationSubscription>();

function createInboxChannel(
  filter: { column: "manager_id" | "worker_id"; value: string }
): RealtimeChannel | null {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const channelName = `inbox:${filter.column}:${filter.value}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `${filter.column}=eq.${filter.value}`,
      },
      (payload) => {
        if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
          return;
        }
        if (!payload.new) return;

        const message = rowToMessage(payload.new as never);
        const key = `${filter.column}:${filter.value}`;
        const sub = inboxSubscriptions.get(key);
        if (!sub) return;

        for (const listener of sub.listeners) {
          listener(message);
        }
      }
    )
    .subscribe();
}

function subscribeToInbox(
  key: string,
  filter: { column: "manager_id" | "worker_id"; value: string },
  listener: Listener
): () => void {
  let sub = inboxSubscriptions.get(key);

  if (!sub) {
    const channel = createInboxChannel(filter);
    if (!channel) return () => {};

    sub = {
      channel,
      listeners: new Set(),
    };
    inboxSubscriptions.set(key, sub);
  }

  sub.listeners.add(listener);

  return () => {
    const current = inboxSubscriptions.get(key);
    if (!current) return;

    current.listeners.delete(listener);
    if (current.listeners.size > 0) return;

    inboxSubscriptions.delete(key);
    const supabase = getSupabaseBrowser();
    if (supabase) {
      void supabase.removeChannel(current.channel);
    }
  };
}

export function subscribeToManagerInbox(
  managerId: string,
  listener: Listener
): () => void {
  return subscribeToInbox(`manager:${managerId}`, {
    column: "manager_id",
    value: managerId,
  }, listener);
}

export function subscribeToWorkerInbox(
  workerId: string,
  listener: Listener
): () => void {
  return subscribeToInbox(`worker:${workerId}`, {
    column: "worker_id",
    value: workerId,
  }, listener);
}
