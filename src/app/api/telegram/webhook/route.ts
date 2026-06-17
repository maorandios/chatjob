import { handleTelegramStartMessage } from "@/lib/telegram/webhook-handlers";
import { NextResponse } from "next/server";

type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
  };
};

export async function POST(req: Request) {
  try {
    const update = (await req.json()) as TelegramUpdate;
    const message = update.message;

    if (message?.text?.startsWith("/start")) {
      await handleTelegramStartMessage(message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram] webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
