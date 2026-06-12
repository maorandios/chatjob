import type { LanguageCode, LanguageOption } from "@/types";

export const LANGUAGES: LanguageOption[] = [
  { code: "th", nativeName: "ไทย", flag: "🇹🇭", dir: "ltr" },
  { code: "zh", nativeName: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "hi", nativeName: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  { code: "fil", nativeName: "Filipino", flag: "🇵🇭", dir: "ltr" },
  { code: "en", nativeName: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "ru", nativeName: "Русский", flag: "🇷🇺", dir: "ltr" },
];

export function getLanguage(code: LanguageCode): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[4];
}

export function getLanguageDir(code: LanguageCode): "ltr" | "rtl" {
  return getLanguage(code).dir;
}
