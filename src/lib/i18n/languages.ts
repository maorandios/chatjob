import type { LanguageCode, LanguageOption } from "@/types";

export const DEFAULT_WORKER_LANGUAGE: LanguageCode = "en";

export const WORKER_LANGUAGES: LanguageOption[] = [
  {
    code: "th",
    englishName: "Thai",
    countryName: "Thailand",
    nativeName: "ไทย",
    countryCode: "TH",
    dir: "ltr",
  },
  {
    code: "ru",
    englishName: "Russian",
    countryName: "Russia",
    nativeName: "Русский",
    countryCode: "RU",
    dir: "ltr",
  },
  {
    code: "en",
    englishName: "English",
    countryName: "English",
    nativeName: "English",
    countryCode: "GB",
    dir: "ltr",
  },
  {
    code: "hi",
    englishName: "Hindi",
    countryName: "India",
    nativeName: "हिन्दी",
    countryCode: "IN",
    dir: "ltr",
  },
  {
    code: "si",
    englishName: "Sinhala",
    countryName: "Sri Lanka",
    nativeName: "සිංහල",
    countryCode: "LK",
    dir: "ltr",
  },
  {
    code: "ro",
    englishName: "Romanian",
    countryName: "Moldova",
    nativeName: "Română",
    countryCode: "MD",
    dir: "ltr",
  },
  {
    code: "ar",
    englishName: "Arabic",
    countryName: "Arabic",
    nativeName: "العربية",
    countryCode: "SA",
    dir: "rtl",
  },
  {
    code: "zh",
    englishName: "Chinese",
    countryName: "China",
    nativeName: "中文",
    countryCode: "CN",
    dir: "ltr",
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

export function getLanguagePickerLabel(lang: LanguageOption): string {
  return `${lang.nativeName} • ${lang.englishName}`;
}
