import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import type { LanguageCode, MessageInputType } from "@/types";
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

const MEDIA_BODY_BY_LANGUAGE: Record<
  LanguageCode | "he",
  { image: string; location: string }
> = {
  he: {
    image: "נשלחה אליך תמונה חדשה",
    location: "שיתפו איתך מיקום חדש",
  },
  en: {
    image: "A new photo was sent to you",
    location: "A new location was shared with you",
  },
  th: {
    image: "มีการส่งรูปภาพใหม่ถึงคุณ",
    location: "มีการแชร์ตำแหน่งใหม่กับคุณ",
  },
  hi: {
    image: "आपको एक नई फ़ोटो भेजी गई है",
    location: "आपके साथ एक नई लोकेशन शेयर की गई है",
  },
  si: {
    image: "ඔබට නව ඡායාරූපයක් එවා ඇත",
    location: "ඔබ සමඟ නව ස්ථානයක් බෙදාගෙන ඇත",
  },
  ro: {
    image: "Ți-a fost trimisă o fotografie nouă",
    location: "A fost partajată o locație nouă cu tine",
  },
  ar: {
    image: "تم إرسال صورة جديدة إليك",
    location: "تمت مشاركة موقع جديد معك",
  },
  ru: {
    image: "Вам отправили новое фото",
    location: "С вами поделились новой геолокацией",
  },
  zh: {
    image: "有人向你发送了一张新照片",
    location: "有人与你共享了新位置",
  },
};

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

function getBody(
  input: MessageNotificationInput,
  recipientRole: NotificationRecipient,
  workerLanguage?: string | null
): string {
  const language =
    recipientRole === "worker"
      ? normalizeWorkerLanguage(workerLanguage)
      : "he";
  const mediaBody = MEDIA_BODY_BY_LANGUAGE[language];
  if (input.inputType === "image") return mediaBody.image;
  if (input.inputType === "location") return mediaBody.location;
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
    { data: alias },
    { data: selfAlias },
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
        .select("name, invite_token, language")
        .eq("id", input.workerId)
        .maybeSingle(),
      supabase
        .from("contact_aliases")
        .select("display_name")
        .eq("owner_role", recipientRole)
        .eq("owner_id", recipientId)
        .eq("contact_role", input.senderRole)
        .eq(
          "contact_id",
          input.senderRole === "manager" ? input.managerId : input.workerId
        )
        .maybeSingle(),
      input.senderRole === "worker"
        ? supabase
            .from("contact_aliases")
            .select("display_name")
            .eq("owner_role", "worker")
            .eq("owner_id", input.workerId)
            .eq("contact_role", "self")
            .eq("contact_id", input.workerId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  if (subscriptionError) throw subscriptionError;
  if (!subscriptions?.length) return;

  const defaultSenderName =
    input.senderRole === "manager"
      ? (manager?.name ?? "קלינג")
      : (worker?.name ?? "קלינג");
  const aliasName = alias?.display_name?.trim();
  const selfAliasName = selfAlias?.display_name?.trim();
  const senderName = aliasName || selfAliasName || defaultSenderName;
  const workerInviteToken = worker?.invite_token ?? null;

  const url =
    recipientRole === "worker"
      ? workerInviteToken
        ? `/join/${encodeURIComponent(workerInviteToken)}/chat/${encodeURIComponent(
            input.managerId
          )}`
        : "/"
      : `/manager/chat/${encodeURIComponent(input.workerId)}`;

  const payload = JSON.stringify({
    title: senderName,
    body: getBody(input, recipientRole, worker?.language),
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

