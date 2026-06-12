import { normalizeDetectedLang } from "@/lib/server/languages";
import { transcribeVoiceMessage } from "@/lib/server/translate";
import type { LanguageCode } from "@/types";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const senderRole = formData.get("senderRole") as "manager" | "worker";
    const workerLanguage = formData.get("workerLanguage") as
      | LanguageCode
      | undefined;

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }
    if (senderRole !== "manager" && senderRole !== "worker") {
      return NextResponse.json({ error: "Invalid senderRole" }, { status: 400 });
    }
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large" }, { status: 400 });
    }

    const result = await transcribeVoiceMessage(audio, senderRole, workerLanguage);

    return NextResponse.json({
      originalText: result.originalText,
      originalLang: normalizeDetectedLang(result.originalLang),
      inputType: "voice" as const,
    });
  } catch (error) {
    console.error("Voice message error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice processing failed" },
      { status: 500 }
    );
  }
}
