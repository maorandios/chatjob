import { parseTelegramStartParam } from "@/lib/telegram/config";
import { sendTelegramMiniAppButton } from "@/lib/telegram/bot-api";

type StartMessage = {
  text?: string;
  chat: { id: number };
  from?: { id: number; username?: string };
};

export async function handleTelegramStartMessage(message: StartMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text ?? "";
  const parts = text.split(/\s+/);
  const startParam = parts[1];
  const parsed = parseTelegramStartParam(startParam);

  if (parsed?.kind === "worker") {
    await sendTelegramMiniAppButton(
      chatId,
      "ברוכים הבאים ל-Kling.\nלחצו לפתיחת האפליקציה, בחרו שפה והתחילו לשוחח עם המנהל.",
      "פתיחת Kling",
      "/telegram"
    );
    return;
  }

  if (parsed?.kind === "manager") {
    await sendTelegramMiniAppButton(
      chatId,
      "ברוכים הבאים ל-Kling.\nלחצו לפתיחת לוח הבקרה של המנהל.",
      "פתיחת Kling",
      "/telegram"
    );
    return;
  }

  await sendTelegramMiniAppButton(
    chatId,
    `שלום! Kling — תרגום שיחות בין מנהלים לעובדים.\n\nפתחו את האפליקציה מהכפתור למטה, או השתמשו בקישור ההזמנה שקיבלתם.`,
    "פתיחת Kling",
    "/telegram"
  );
}
