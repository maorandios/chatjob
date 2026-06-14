import type { TranslationContextMessage } from "@/lib/server/glossary";
import type { LanguageCode, MessageInputType } from "@/types";

export type ProcessedMessage = {
  originalText: string;
  originalLang: string;
  translatedText: string;
  targetLang: string;
  inputType: MessageInputType;
};

export type VoiceTranscription = {
  originalText: string;
  originalLang: string;
  inputType: "voice";
};

export type TranslateMessageOptions = {
  workerId?: string;
  originalLang?: string;
  lockSourceLang?: boolean;
  context?: TranslationContextMessage[];
  inputType?: MessageInputType;
};

type ApiErrorBody = { error?: string; code?: string };

function readApiError(data: ApiErrorBody, fallback: string): string {
  if (data.code === "OPENAI_NOT_CONFIGURED") {
    return "Voice requires OpenAI — add OPENAI_API_KEY in Vercel project settings.";
  }
  return data.error ?? fallback;
}

export async function sendTextMessage(
  text: string,
  senderRole: "manager" | "worker",
  workerLanguage?: LanguageCode,
  options?: TranslateMessageOptions
): Promise<ProcessedMessage> {
  const res = await fetch("/api/messages/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      senderRole,
      workerId: options?.workerId,
      workerLanguage,
      originalLang: options?.originalLang,
      lockSourceLang: options?.lockSourceLang,
      context: options?.context,
      inputType: options?.inputType ?? "text",
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(readApiError(data, "Failed to send message"));
  }

  return res.json();
}

export async function transcribeVoiceMessage(
  audio: Blob,
  senderRole: "manager" | "worker",
  workerLanguage?: LanguageCode
): Promise<VoiceTranscription> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  formData.append("senderRole", senderRole);
  if (workerLanguage) {
    formData.append("workerLanguage", workerLanguage);
  }

  const res = await fetch("/api/messages/voice", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(readApiError(data, "Failed to transcribe voice message"));
  }

  return res.json();
}
