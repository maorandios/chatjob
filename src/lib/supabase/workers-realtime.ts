import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { rowToWorker } from "@/lib/supabase/mappers";
import type { Worker } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Listener = (worker: Worker) => void;

type CompanyWorkersSubscription = {
  channel: RealtimeChannel;
  listeners: Set<Listener>;
};

const subscriptions = new Map<string, CompanyWorkersSubscription>();

function createCompanyWorkersChannel(companyId: string): RealtimeChannel | null {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const channelName = `workers:company:${companyId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workers",
        filter: `company_id=eq.${companyId}`,
      },
      (payload) => {
        if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
          return;
        }
        if (!payload.new) return;

        const worker = rowToWorker(payload.new as never);
        const sub = subscriptions.get(companyId);
        if (!sub) return;

        for (const listener of sub.listeners) {
          listener(worker);
        }
      }
    )
    .subscribe();
}

export function subscribeToCompanyWorkers(
  companyId: string,
  listener: Listener
): () => void {
  if (!companyId) return () => {};

  let sub = subscriptions.get(companyId);

  if (!sub) {
    const channel = createCompanyWorkersChannel(companyId);
    if (!channel) return () => {};

    sub = {
      channel,
      listeners: new Set(),
    };
    subscriptions.set(companyId, sub);
  }

  sub.listeners.add(listener);

  return () => {
    const current = subscriptions.get(companyId);
    if (!current) return;

    current.listeners.delete(listener);
    if (current.listeners.size > 0) return;

    subscriptions.delete(companyId);
    const supabase = getSupabaseBrowser();
    if (supabase) {
      void supabase.removeChannel(current.channel);
    }
  };
}
