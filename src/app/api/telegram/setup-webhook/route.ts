import {
  getTelegramBotInfo,
  getWebhookUrl,
  setTelegramChatMenuButton,
  setTelegramWebhook,
} from "@/lib/telegram/bot-api";
import { getTelegramMiniAppUrl } from "@/lib/telegram/config";
import { getTelegramSetupSecret } from "@/lib/telegram/config";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const secret = getTelegramSetupSecret();
    const authHeader = req.headers.get("authorization");
    const body = await req.json().catch(() => ({}));
    const providedSecret =
      typeof body.secret === "string"
        ? body.secret
        : authHeader?.replace(/^Bearer\s+/i, "");

    if (!secret || providedSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bot = await getTelegramBotInfo();
    const webhookUrl = getWebhookUrl();
    await setTelegramWebhook(webhookUrl);
    await setTelegramChatMenuButton("/telegram");

    return NextResponse.json({
      ok: true,
      bot,
      webhookUrl,
      miniAppUrl: getTelegramMiniAppUrl("/telegram"),
    });
  } catch (error) {
    console.error("[Telegram] setup-webhook error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to configure Telegram",
      },
      { status: 500 }
    );
  }
}
