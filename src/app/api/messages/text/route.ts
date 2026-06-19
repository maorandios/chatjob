import {
  getTranslationSourceHint,
  getTranslationTarget,
  normalizeDetectedLang,
  shouldLockSourceLanguage,
} from "@/lib/server/languages";
import type { TranslationContextMessage } from "@/lib/server/glossary";
import { apiErrorResponse } from "@/lib/server/api-errors";
import { translateTextOrOriginal } from "@/lib/server/translate";
import { resolveWorkerLanguageForTranslation } from "@/lib/supabase/company-access";
import type { LanguageCode, MessageInputType } from "@/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    const senderRole = body.senderRole as "manager" | "worker";
    const workerLanguage = body.workerLanguage as LanguageCode | undefined;
    const workerId = body.workerId as string | undefined;
    const originalLang = body.originalLang as string | undefined;
    const lockSourceLang = Boolean(body.lockSourceLang);
    const context = body.context as TranslationContextMessage[] | undefined;
    const inputType = (body.inputType as MessageInputType) ?? "text";

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (senderRole !== "manager" && senderRole !== "worker") {
      return NextResponse.json({ error: "Invalid senderRole" }, { status: 400 });
    }

    const effectiveWorkerLanguage =
      senderRole === "manager" && workerId
        ? await resolveWorkerLanguageForTranslation(workerId, workerLanguage)
        : workerLanguage;
    const targetLang = getTranslationTarget(senderRole, effectiveWorkerLanguage);
    const hintedSource = getTranslationSourceHint(senderRole, originalLang);
    const shouldLock = shouldLockSourceLanguage(
      senderRole,
      lockSourceLang,
      originalLang
    );

    const result = await translateTextOrOriginal(text, targetLang, hintedSource, {
      lockSourceLang: shouldLock,
      context: Array.isArray(context) ? context : undefined,
    });

    return NextResponse.json({
      originalText: result.originalText,
      originalLang: normalizeDetectedLang(result.originalLang),
      translatedText: result.translatedText,
      targetLang: normalizeDetectedLang(result.targetLang),
      inputType,
    });
  } catch (error) {
    console.error("Text message error:", error);
    return apiErrorResponse(error, "Translation failed");
  }
}
