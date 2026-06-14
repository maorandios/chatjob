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
