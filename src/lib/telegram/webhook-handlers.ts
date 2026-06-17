import { buildTelegramMiniAppPath, parseTelegramStartParam } from "@/lib/telegram/config";
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
      "ברוכים הבאים ל-Kling.\nלחצו על הכפתור למטה, בחרו שפה ובחרו מנהל לשיחה.",
      "פתיחת Kling",
      buildTelegramMiniAppPath(parsed)
    );
    return;
  }

  if (parsed?.kind === "manager") {
    await sendTelegramMiniAppButton(
      chatId,
      "ברוכים הבאים ל-Kling.\nלחצו על הכפתור למטה כדי לראות את רשימת העובדים ולהתחיל לשוחח.",
      "פתיחת Kling",
      buildTelegramMiniAppPath(parsed)
    );
    return;
  }

  await sendTelegramMiniAppButton(
    chatId,
    `שלום! Kling — תרגום שיחות בין מנהלים לעובדים.\n\nלחצו על הכפתור למטה לרשימת השיחות, או השתמשו בקישור ההזמנה שקיבלתם.`,
    "פתיחת Kling",
    "/telegram/inbox"
  );
}
