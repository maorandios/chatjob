import type { LanguageCode } from "@/types";

type PhraseMap = Record<string, Partial<Record<LanguageCode | "he", string>>>;

const phrases: PhraseMap = {
  "שלום, מה שלומך היום?": {
    he: "שלום, מה שלומך היום?",
    th: "สวัสดี วันนี้เป็นอย่างไรบ้าง?",
    hi: "नमस्ते, आज आप कैसे हैं?",
    en: "Hello, how are you today?",
    si: "හෙලෝ, අද ඔබට කොහොමද?",
    ro: "Bună, ce mai faci azi?",
    ar: "مرحباً، كيف حالك اليوم؟",
    ru: "Привет, как дела сегодня?",
  },
  "הגעתי לאתר": {
    he: "הגעתי לאתר",
    th: "ถึงไซต์แล้ว",
    hi: "मैं साइट पर पहुँच गया",
    en: "I arrived at the site",
    si: "මම අඩවියට පැමිණියා",
    ro: "Am ajuns pe șantier",
    ar: "وصلت إلى الموقع",
    ru: "Я прибыл на объект",
  },
  "אני בדרך": {
    he: "אני בדרך",
    th: "กำลังไป",
    hi: "मैं रास्ते में हूँ",
    en: "I'm on my way",
    si: "මම එන ගමන්",
    ro: "Sunt pe drum",
    ar: "أنا في الطريق",
    ru: "Я в пути",
  },
  "יש בעיה": {
    he: "יש בעיה",
    th: "มีปัญหา",
    hi: "कोई समस्या है",
    en: "There's a problem",
    si: "ගැටලුවක් තියෙනවා",
    ro: "Este o problemă",
    ar: "هناك مشكلة",
    ru: "Есть проблема",
  },
  "תודה, הכל בסדר": {
    he: "תודה, הכל בסדר",
    th: "ขอบคุณ ทุกอย่างเรียบร้อย",
    hi: "धन्यवाद, सब ठीक है",
    en: "Thanks, everything is fine",
    si: "ස්තූතියි, සියල්ල හරි",
    ro: "Mulțumesc, totul e în regulă",
    ar: "شكراً، كل شيء بخير",
    ru: "Спасибо, всё в порядке",
  },
  "מחר תתחיל בשעה 7": {
    he: "מחר תתחיל בשעה 7",
    th: "พรุ่งนี้เริ่มเวลา 7 โมง",
    hi: "कल सुबह 7 बजे शुरू",
    en: "Tomorrow you start at 7",
    si: "හෙට උදේ 7 ට පටන් ගන්න",
    ro: "Mâine începi la ora 7",
    ar: "غداً تبدأ الساعة 7",
    ru: "Завтра начинаешь в 7",
  },
};

const reversePhrases: PhraseMap = {};

for (const [hebrew, map] of Object.entries(phrases)) {
  for (const [lang, text] of Object.entries(map)) {
    if (lang !== "he" && text) {
      if (!reversePhrases[text]) reversePhrases[text] = {};
      reversePhrases[text].he = hebrew;
    }
  }
}

export function mockTranslate(
  text: string,
  fromLang: string,
  toLang: string
): string {
  const trimmed = text.trim();
  if (fromLang === toLang) return trimmed;

  if (fromLang === "he" && phrases[trimmed]?.[toLang as LanguageCode]) {
    return phrases[trimmed][toLang as LanguageCode]!;
  }

  if (toLang === "he" && reversePhrases[trimmed]?.he) {
    return reversePhrases[trimmed].he!;
  }

  const langLabels: Record<string, string> = {
    he: "עברית",
    th: "ไทย",
    hi: "हिन्दी",
    en: "English",
    si: "සිංහල",
    ro: "Română",
    ar: "العربية",
    ru: "Русский",
  };

  if (toLang === "he") {
    return `[תרגום מ${langLabels[fromLang] ?? fromLang}] ${trimmed}`;
  }

  return `[${langLabels[toLang] ?? toLang}] ${trimmed}`;
}

export function getQuickReplyPhrases(lang: LanguageCode): string[] {
  return [
    mockTranslate("הגעתי לאתר", "he", lang),
    mockTranslate("אני בדרך", "he", lang),
    mockTranslate("יש בעיה", "he", lang),
  ];
}
