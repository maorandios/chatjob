import type { LanguageCode } from "@/types";

type PhraseMap = Record<string, Partial<Record<LanguageCode | "he", string>>>;

const phrases: PhraseMap = {
  "שלום, מה שלומך היום?": {
    he: "שלום, מה שלומך היום?",
    th: "สวัสดี วันนี้เป็นอย่างไรบ้าง?",
    zh: "你好，今天怎么样？",
    hi: "नमस्ते, आज आप कैसे हैं?",
    fil: "Kumusta ka ngayon?",
    en: "Hello, how are you today?",
    ar: "مرحباً، كيف حالك اليوم؟",
    ru: "Привет, как дела сегодня?",
  },
  "הגעתי לאתר": {
    he: "הגעתי לאתר",
    th: "ถึงไซต์แล้ว",
    zh: "我已到达工地",
    hi: "मैं साइट पर पहुँच गया",
    fil: "Nakarating na ako sa site",
    en: "I arrived at the site",
    ar: "وصلت إلى الموقع",
    ru: "Я прибыл на объект",
  },
  "אני בדרך": {
    he: "אני בדרך",
    th: "กำลังไป",
    zh: "我在路上",
    hi: "मैं रास्ते में हूँ",
    fil: "Papunta na ako",
    en: "I'm on my way",
    ar: "أنا في الطريق",
    ru: "Я в пути",
  },
  "יש בעיה": {
    he: "יש בעיה",
    th: "มีปัญหา",
    zh: "有问题",
    hi: "कोई समस्या है",
    fil: "May problema",
    en: "There's a problem",
    ar: "هناك مشكلة",
    ru: "Есть проблема",
  },
  "תודה, הכל בסדר": {
    he: "תודה, הכל בסדר",
    th: "ขอบคุณ ทุกอย่างเรียบร้อย",
    zh: "谢谢，一切都好",
    hi: "धन्यवाद, सब ठीक है",
    fil: "Salamat, ayos lang",
    en: "Thanks, everything is fine",
    ar: "شكراً، كل شيء بخير",
    ru: "Спасибо, всё в порядке",
  },
  "מחר תתחיל בשעה 7": {
    he: "מחר תתחיל בשעה 7",
    th: "พรุ่งนี้เริ่มเวลา 7 โมง",
    zh: "明天7点开始",
    hi: "कल सुबह 7 बजे शुरू",
    fil: "Bukas magsisimula ng 7",
    en: "Tomorrow you start at 7",
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
    zh: "中文",
    hi: "हिन्दी",
    fil: "Filipino",
    en: "English",
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
