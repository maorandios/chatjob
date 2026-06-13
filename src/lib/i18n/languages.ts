import type { LanguageCode, LanguageOption } from "@/types";

export const DEFAULT_WORKER_LANGUAGE: LanguageCode = "en";

export const WORKER_LANGUAGES: LanguageOption[] = [
  {
    code: "th",
    countryName: "Thailand",
    nativeName: "ไทย",
    flag: "🇹🇭",
    dir: "ltr",
  },
  {
    code: "ru",
    countryName: "Russia",
    nativeName: "Русский",
    flag: "🇷🇺",
    dir: "ltr",
  },
  {
    code: "en",
    countryName: "English",
    nativeName: "English",
    flag: "🇬🇧",
    dir: "ltr",
  },
  {
    code: "hi",
    countryName: "India",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    dir: "ltr",
  },
  {
    code: "si",
    countryName: "Sri Lanka",
    nativeName: "සිංහල",
    flag: "🇱🇰",
    dir: "ltr",
  },
  {
    code: "ro",
    countryName: "Moldova",
    nativeName: "Română",
    flag: "🇲🇩",
    dir: "ltr",
  },
  {
    code: "ar",
    countryName: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    dir: "rtl",
  },
];

/** @deprecated use WORKER_LANGUAGES */
export const LANGUAGES = WORKER_LANGUAGES;

const LANGUAGE_CODE_SET = new Set<string>(WORKER_LANGUAGES.map((l) => l.code));

export function normalizeWorkerLanguage(
  code?: string | null
): LanguageCode {
  if (code && LANGUAGE_CODE_SET.has(code)) {
    return code as LanguageCode;
  }
  return DEFAULT_WORKER_LANGUAGE;
}

export function getLanguage(code: LanguageCode | string | undefined): LanguageOption {
  const normalized = normalizeWorkerLanguage(code);
  return (
    WORKER_LANGUAGES.find((l) => l.code === normalized) ??
    WORKER_LANGUAGES.find((l) => l.code === DEFAULT_WORKER_LANGUAGE)!
  );
}

export function getLanguageDir(code: LanguageCode | string | undefined): "ltr" | "rtl" {
  return getLanguage(code).dir;
}
