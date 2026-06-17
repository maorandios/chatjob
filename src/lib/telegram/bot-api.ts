import {
  getAppPublicUrl,
  getTelegramBotToken,
  getTelegramMiniAppUrl,
} from "@/lib/telegram/config";

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

async function callTelegramApi<T>(
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const token = getTelegramBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as TelegramApiResponse<T>;
  if (!res.ok || !data.ok) {
    throw new Error(data.description ?? `Telegram API ${method} failed`);
  }

  if (data.result === undefined) {
    throw new Error(`Telegram API ${method} returned no result`);
  }

  return data.result;
}

export type TelegramBotInfo = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
};

export async function getTelegramBotInfo(): Promise<TelegramBotInfo> {
  return callTelegramApi<TelegramBotInfo>("getMe", {});
}

export async function setTelegramWebhook(url: string): Promise<boolean> {
  return callTelegramApi<boolean>("setWebhook", {
    url,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: {
    replyMarkup?: {
      inline_keyboard: Array<
        Array<{
          text: string;
          web_app?: { url: string };
          url?: string;
        }>
      >;
    };
  }
): Promise<void> {
  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: options?.replyMarkup,
  });
}

export async function sendTelegramMiniAppButton(
  chatId: number,
  text: string,
  buttonLabel: string,
  miniAppPath = "/telegram"
): Promise<void> {
  await sendTelegramMessage(chatId, text, {
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: buttonLabel,
            web_app: { url: getTelegramMiniAppUrl(miniAppPath) },
          },
        ],
      ],
    },
  });
}

export async function setTelegramChatMenuButton(
  miniAppPath = "/telegram"
): Promise<boolean> {
  return callTelegramApi<boolean>("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Open Kling",
      web_app: { url: getTelegramMiniAppUrl(miniAppPath) },
    },
  });
}

export function getWebhookUrl(): string {
  return `${getAppPublicUrl()}/api/telegram/webhook`;
}
