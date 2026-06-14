import {
  getTranslationSourceHint,
  getTranslationTarget,
  normalizeDetectedLang,
  shouldLockSourceLanguage,
} from "@/lib/server/languages";
import type { TranslationContextMessage } from "@/lib/server/glossary";
import { apiErrorResponse } from "@/lib/server/api-errors";
import { translateText } from "@/lib/server/translate";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToMessage } from "@/lib/supabase/mappers";
import type { LanguageCode, MessageInputType } from "@/types";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get("workerId");

    if (!workerId) {
      return NextResponse.json({ error: "workerId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      messages: (data ?? []).map(rowToMessage),
    });
  } catch (error) {
    console.error("List messages error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workerId = String(body.workerId ?? "");
    const senderRole = body.senderRole as "manager" | "worker";
    const workerLanguage = body.workerLanguage as LanguageCode | undefined;
    const inputType = (body.inputType as MessageInputType) ?? "text";
    const context = body.context as TranslationContextMessage[] | undefined;

    if (!workerId) {
      return NextResponse.json({ error: "workerId required" }, { status: 400 });
    }
    if (senderRole !== "manager" && senderRole !== "worker") {
      return NextResponse.json({ error: "Invalid senderRole" }, { status: 400 });
    }

    let originalText = String(body.originalText ?? body.text ?? "").trim();
    let originalLang = String(body.originalLang ?? "");
    let translatedText = body.translatedText as string | undefined;
    let targetLang = body.targetLang as string | undefined;
    let imageUrl = body.imageUrl as string | undefined;

    if (inputType === "image") {
      imageUrl = String(body.imageUrl ?? "");
      originalText = originalText || "📷";
      originalLang = originalLang || (senderRole === "manager" ? "he" : "en");
    } else if (body.processed) {
      originalText = String(body.processed.originalText ?? "");
      originalLang = String(body.processed.originalLang ?? "");
      translatedText = String(body.processed.translatedText ?? "");
      targetLang = String(body.processed.targetLang ?? "");
    } else {
      const text = String(body.text ?? "").trim();
      if (!text) {
        return NextResponse.json({ error: "Text is required" }, { status: 400 });
      }

      const lockSourceLang = Boolean(body.lockSourceLang);
      const hintedSource = getTranslationSourceHint(senderRole, body.originalLang);
      const shouldLock = shouldLockSourceLanguage(
        senderRole,
        lockSourceLang,
        body.originalLang
      );
      const translationTarget = getTranslationTarget(senderRole, workerLanguage);

      const result = await translateText(text, translationTarget, hintedSource, {
        lockSourceLang: shouldLock,
        context: Array.isArray(context) ? context : undefined,
      });

      originalText = result.originalText;
      originalLang = normalizeDetectedLang(result.originalLang);
      translatedText = result.translatedText;
      targetLang = normalizeDetectedLang(result.targetLang);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        worker_id: workerId,
        sender_role: senderRole,
        original_text: originalText,
        original_lang: originalLang,
        translated_text: translatedText ?? null,
        target_lang: targetLang ?? null,
        input_type: inputType,
        image_url: imageUrl ?? null,
        status: "sent",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ message: rowToMessage(data) });
  } catch (error) {
    console.error("Create message error:", error);
    return apiErrorResponse(error, "Failed to send message");
  }
}
