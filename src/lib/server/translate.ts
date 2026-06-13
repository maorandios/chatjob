import {
  getLanguageLabel,
  getTranscriptionPrompt,
  getWhisperLanguageHint,
  normalizeDetectedLang,
} from "@/lib/server/languages";
import type { TranslationContextMessage } from "@/lib/server/glossary";
import { getOpenAI } from "@/lib/server/openai";
import type { LanguageCode } from "@/types";

const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const TRANSCRIBE_FALLBACK_MODEL = "whisper-1";

function detectLanguageFromText(
  text: string,
  workerLanguage?: LanguageCode
): string {
  if (!text) return workerLanguage ?? "en";
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  if (/[\u0D80-\u0DFF]/.test(text)) return "si";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/^[a-zA-Z0-9\s.,!?'"-]+$/.test(text)) return "en";
  return workerLanguage ?? "en";
}

export type TranslationResult = {
  originalText: string;
  originalLang: string;
  translatedText: string;
  targetLang: string;
};

type TranslateOptions = {
  lockSourceLang?: boolean;
  context?: TranslationContextMessage[];
};

function formatContext(context?: TranslationContextMessage[]): string {
  if (!context?.length) return "";
  const lines = context
    .map((m) => `${m.role === "manager" ? "Manager" : "Worker"}: ${m.text}`)
    .join("\n");
  return `\nRecent conversation (context only, do not copy phrases from it):\n${lines}\n`;
}

function buildTranslationPrompt(
  targetLang: string,
  sourceLang?: string,
  lockSourceLang?: boolean,
  context?: TranslationContextMessage[]
): string {
  const normalizedTarget = normalizeDetectedLang(targetLang);
  const targetLabel = getLanguageLabel(normalizedTarget);
  const contextBlock = formatContext(context);

  const sharedRules = `You translate short WhatsApp-style workplace messages on a construction site.
${contextBlock}
Rules:
- Translate ONLY the new message below — do not invent or substitute a different message.
- Preserve the exact meaning, tense, and intent (e.g. "coming" ≠ "here", "tomorrow" ≠ "today").
- Preserve names, numbers, times, and places exactly.
- Use natural, grammatically correct ${targetLabel} as people speak in casual chat.
- Keep the same length and tone as the original.
- No explanations.`;

  if (lockSourceLang && sourceLang) {
    const sourceLabel = getLanguageLabel(normalizeDetectedLang(sourceLang));
    return `${sharedRules}
Return JSON only: {"translatedText":"<translation>"}
- Source language is ${sourceLabel} (${normalizeDetectedLang(sourceLang)}).
- Translate into ${targetLabel} (${normalizedTarget}).
- If source and target are the same, return the original text unchanged.`;
  }

  return `${sharedRules}
Return JSON only: {"originalLang":"<ISO 639-1>","translatedText":"<translation>"}
- Detect the source language from the message text${sourceLang ? ` (weak hint: may be ${sourceLang})` : ""}.
- Translate into ${targetLabel} (${normalizedTarget}).
- If source and target are the same language, set translatedText equal to the original.`;
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
  options?: TranslateOptions
): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Text is empty");
  }

  const normalizedTarget = normalizeDetectedLang(targetLang);
  const lockedSource = options?.lockSourceLang
    ? normalizeDetectedLang(sourceLang ?? "en")
    : undefined;

  if (lockedSource && lockedSource === normalizedTarget) {
    return {
      originalText: trimmed,
      originalLang: lockedSource,
      translatedText: trimmed,
      targetLang: normalizedTarget,
    };
  }

  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildTranslationPrompt(
          normalizedTarget,
          lockedSource ?? sourceLang,
          options?.lockSourceLang,
          options?.context
        ),
      },
      { role: "user", content: trimmed },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Translation failed");

  const parsed = JSON.parse(raw) as {
    originalLang?: string;
    translatedText?: string;
  };

  const originalLang = lockedSource
    ? lockedSource
    : normalizeDetectedLang(parsed.originalLang ?? sourceLang ?? "en");
  const translatedText = (parsed.translatedText ?? trimmed).trim();

  return {
    originalText: trimmed,
    originalLang,
    translatedText,
    targetLang: normalizedTarget,
  };
}

async function runTranscription(
  openai: ReturnType<typeof getOpenAI>,
  file: File,
  model: string,
  languageHint?: string,
  prompt?: string
): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file,
    model,
    ...(languageHint ? { language: languageHint } : {}),
    ...(prompt ? { prompt } : {}),
    ...(model === TRANSCRIBE_FALLBACK_MODEL
      ? { response_format: "verbose_json" as const }
      : {}),
  });

  const result = transcription as { text?: string };
  return (result.text ?? "").trim();
}

async function transcribeWithModel(
  openai: ReturnType<typeof getOpenAI>,
  file: File,
  languageHint?: string,
  prompt?: string
): Promise<string> {
  try {
    return await runTranscription(
      openai,
      file,
      TRANSCRIBE_MODEL,
      languageHint,
      prompt
    );
  } catch (primaryError) {
    console.warn("Primary transcribe model failed, falling back:", primaryError);
    return runTranscription(
      openai,
      file,
      TRANSCRIBE_FALLBACK_MODEL,
      languageHint,
      prompt
    );
  }
}

export async function transcribeAudio(
  file: File,
  senderRole: "manager" | "worker",
  workerLanguage?: LanguageCode
): Promise<{ text: string; language: string }> {
  const openai = getOpenAI();

  const text = await transcribeWithModel(
    openai,
    file,
    getWhisperLanguageHint(senderRole, workerLanguage),
    getTranscriptionPrompt(senderRole, workerLanguage)
  );

  if (!text) throw new Error("Could not transcribe audio");

  return {
    text,
    language: detectLanguageFromText(text, workerLanguage),
  };
}

export async function transcribeVoiceMessage(
  file: File,
  senderRole: "manager" | "worker",
  workerLanguage?: LanguageCode
): Promise<{ originalText: string; originalLang: string; inputType: "voice" }> {
  const { text, language } = await transcribeAudio(
    file,
    senderRole,
    workerLanguage
  );

  const spokenLang = normalizeDetectedLang(language);
  const uiLang = workerLanguage
    ? normalizeDetectedLang(workerLanguage)
    : undefined;

  if (
    senderRole === "worker" &&
    uiLang &&
    spokenLang !== uiLang
  ) {
    const localized = await translateText(text, uiLang, spokenLang, {
      lockSourceLang: true,
    });
    return {
      originalText: localized.translatedText,
      originalLang: uiLang,
      inputType: "voice",
    };
  }

  return {
    originalText: text,
    originalLang: spokenLang,
    inputType: "voice",
  };
}
