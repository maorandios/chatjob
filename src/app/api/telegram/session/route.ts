import { resolveTelegramSession } from "@/lib/telegram/link-account";
import { startParamFromMiniAppSearch } from "@/lib/telegram/config";
import { verifyTelegramInitData } from "@/lib/telegram/verify-init-data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = typeof body.initData === "string" ? body.initData : "";

    if (!initData) {
      return NextResponse.json({ error: "initData required" }, { status: 400 });
    }

    const parsed = verifyTelegramInitData(initData);
    const startParamOverride =
      typeof body.startParam === "string" && body.startParam.trim()
        ? body.startParam.trim()
        : startParamFromMiniAppSearch(
            typeof body.search === "string" ? body.search : ""
          );

    const session = await resolveTelegramSession(parsed, {
      startParamOverride: startParamOverride || undefined,
    });

    return NextResponse.json({
      user: parsed.user,
      session,
    });
  } catch (error) {
    console.error("[Telegram] session error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to resolve Telegram session",
      },
      { status: 401 }
    );
  }
}
