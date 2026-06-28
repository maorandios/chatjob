import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MessageInputType } from "@/types";
import webpush, { type PushSubscription } from "web-push";

type NotificationRecipient = "manager" | "worker";

type MessageNotificationInput = {
  managerId: string;
  workerId: string;
  senderRole: "manager" | "worker";
  originalText: string;
  translatedText?: string | null;
  inputType?: MessageInputType;
};

let configured = false;

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "mailto:admin@chatjob.vercel.app";

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function ensureConfigured(): boolean {
  const config = getVapidConfig();
  if (!config) {
    console.warn("[Slang] Push notifications skipped: missing VAPID keys");
    return false;
  }

  if (!configured) {
    webpush.setVapidDetails(
      config.subject,
      config.publicKey,
      config.privateKey
    );
    configured = true;
  }

  return true;
}

function getBody(input: MessageNotificationInput): string {
  if (input.inputType === "image") return "תמונה חדשה";
  return (input.translatedText || input.originalText).trim();
}

function toSubscription(row: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): PushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

async function deleteExpiredSubscription(endpoint: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function sendMessagePushNotification(
  input: MessageNotificationInput
): Promise<void> {
  if (!ensureConfigured()) return;

  const recipientRole: NotificationRecipient =
    input.senderRole === "manager" ? "worker" : "manager";
  const recipientId =
    recipientRole === "worker" ? input.workerId : input.managerId;
  const supabase = getSupabaseAdmin();

  const [
    { data: subscriptions, error: subscriptionError },
    { data: manager },
    { data: worker },
  ] = await Promise.all([
      supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_role", recipientRole)
        .eq("user_id", recipientId),
      supabase
        .from("managers")
        .select("name")
        .eq("id", input.managerId)
        .maybeSingle(),
      supabase
        .from("workers")
        .select("name, invite_token")
        .eq("id", input.workerId)
        .maybeSingle(),
    ]);

  if (subscriptionError) throw subscriptionError;
  if (!subscriptions?.length) return;

  const senderName =
    input.senderRole === "manager"
      ? (manager?.name ?? "קלינג")
      : (worker?.name ?? "קלינג");
  const workerInviteToken = worker?.invite_token ?? null;

  const url =
    recipientRole === "worker"
      ? workerInviteToken
        ? `/join/${encodeURIComponent(workerInviteToken)}/chat/${encodeURIComponent(
            input.managerId
          )}`
        : "/"
      : workerInviteToken
        ? `/c/${encodeURIComponent(workerInviteToken)}`
        : "/manager";

  const payload = JSON.stringify({
    title: senderName,
    body: getBody(input),
    url,
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(toSubscription(subscription), payload);
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : null;
        if (
          statusCode !== null &&
          (statusCode === 404 || statusCode === 410)
        ) {
          await deleteExpiredSubscription(subscription.endpoint);
          return;
        }
        console.error("[Slang] Failed to send push notification", error);
      }
    })
  );
}

