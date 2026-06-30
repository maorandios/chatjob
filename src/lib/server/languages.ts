import type { LanguageCode } from "@/types";

export const LANGUAGE_LABELS: Record<string, string> = {
  he: "Hebrew",
  th: "Thai",
  hi: "Hindi",
  en: "English",
  si: "Sinhala",
  ro: "Romanian",
  uz: "Uzbek",
  vi: "Vietnamese",
  az: "Azerbaijani",
  ar: "Arabic",
  ru: "Russian",
  zh: "Chinese",
};

/** Light domain hint only — no example phrases that bias transcription. */
export const TRANSCRIPTION_CONTEXT =
  "Workplace chat on a construction site between a manager and workers.";

export function normalizeDetectedLang(code: string): string {
  const lower = code.toLowerCase().split("-")[0];
  if (lower === "md") return "ro";
  return lower;
}

export function getTranslationTarget(
  senderRole: "manager" | "worker",
  workerLanguage?: LanguageCode
): string {
  return senderRole === "manager" ? (workerLanguage ?? "en") : "he";
}

export function getLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code;
}

/** Managers usually speak Hebrew; workers may speak any language. */
export function getWhisperLanguageHint(
  senderRole: "manager" | "worker",
  _workerLanguage?: LanguageCode
): string | undefined {
  if (senderRole === "manager") return "he";
  return undefined;
}

export function getTranscriptionPrompt(
  senderRole: "manager" | "worker",
  _workerLanguage?: LanguageCode
): string | undefined {
  if (senderRole === "manager") {
    return `${TRANSCRIPTION_CONTEXT} Transcribe verbatim in Hebrew. Do not translate.`;
  }
  return `${TRANSCRIPTION_CONTEXT} The speaker is a foreign worker in Israel. Transcribe their words verbatim in whatever language they are actually speaking — Hebrew, English, or their native language. Do NOT translate or transliterate into a different language or script.`;
}

/** UI language is for labels only — never assume worker messages use it. */
export function getTranslationSourceHint(
  senderRole: "manager" | "worker",
  originalLang?: string
): string | undefined {
  if (originalLang) return normalizeDetectedLang(originalLang);
  if (senderRole === "manager") return "he";
  return undefined;
}

export function shouldLockSourceLanguage(
  senderRole: "manager" | "worker",
  lockRequested: boolean,
  originalLang?: string
): boolean {
  return lockRequested && Boolean(originalLang) && senderRole === "manager";
}
