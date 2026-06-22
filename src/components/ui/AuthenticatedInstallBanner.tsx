"use client";

import { InstallAppBanner } from "@/components/ui/InstallAppBanner";
import type { InstallAppSheetLabels } from "@/components/ui/InstallAppSheet";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useSlangStore } from "@/lib/store";
import { isWorkerJoined } from "@/lib/workers/invite-status";
import type { LanguageCode } from "@/types";
import { usePathname } from "next/navigation";

const MANAGER_INSTALL_LABELS: InstallAppSheetLabels = {
  title: "התקנת קלינג",
  iosTitle: "התקנה באייפון",
  iosSubtitle: "פתחו את תפריט השיתוף והוסיפו את קלינג למסך הבית.",
  iosStepShare: "לחצו על כפתור השיתוף בדפדפן",
  iosStepHome: "בחרו ״הוסף למסך הבית״",
  iosStepDone: "אשרו, ופתחו את קלינג מהאייקון במסך הבית",
  androidTitle: "התקנה באנדרואיד",
  androidReady: "אפשר להתקין את קלינג ישירות למסך הבית.",
  androidUnavailable: "אם כפתור ההתקנה לא מופיע, פתחו את תפריט הדפדפן ובחרו התקנה או הוספה למסך הבית.",
  androidButton: "התקינו את קלינג",
  laterButton: "אחר כך",
};

const WORKER_INSTALL_LABELS: Record<LanguageCode, InstallAppSheetLabels> = {
  en: {
    title: "Install Kling",
    iosTitle: "Install on iPhone",
    iosSubtitle: "Open the share menu and add Kling to your home screen.",
    iosStepShare: "Tap the Share button in the browser",
    iosStepHome: "Choose Add to Home Screen",
    iosStepDone: "Confirm and open Kling from your home screen",
    androidTitle: "Install on Android",
    androidReady: "You can install Kling directly to your home screen.",
    androidUnavailable: "If the install button is unavailable, open the browser menu and choose Install app or Add to Home screen.",
    androidButton: "Install Kling",
    laterButton: "Later",
  },
  th: {
    title: "ติดตั้ง Kling",
    iosTitle: "ติดตั้งบน iPhone",
    iosSubtitle: "เปิดเมนูแชร์ แล้วเพิ่ม Kling ไปยังหน้าจอหลัก",
    iosStepShare: "แตะปุ่มแชร์ในเบราว์เซอร์",
    iosStepHome: "เลือก เพิ่มไปยังหน้าจอหลัก",
    iosStepDone: "ยืนยัน แล้วเปิด Kling จากหน้าจอหลัก",
    androidTitle: "ติดตั้งบน Android",
    androidReady: "คุณสามารถติดตั้ง Kling ไปยังหน้าจอหลักได้โดยตรง",
    androidUnavailable: "ถ้าปุ่มติดตั้งไม่แสดง ให้เปิดเมนูเบราว์เซอร์แล้วเลือกติดตั้งหรือเพิ่มไปยังหน้าจอหลัก",
    androidButton: "ติดตั้ง Kling",
    laterButton: "ภายหลัง",
  },
  hi: {
    title: "Kling इंस्टॉल करें",
    iosTitle: "iPhone पर इंस्टॉल करें",
    iosSubtitle: "शेयर मेनू खोलें और Kling को होम स्क्रीन में जोड़ें।",
    iosStepShare: "ब्राउज़र में Share बटन दबाएँ",
    iosStepHome: "Add to Home Screen चुनें",
    iosStepDone: "पुष्टि करें और होम स्क्रीन से Kling खोलें",
    androidTitle: "Android पर इंस्टॉल करें",
    androidReady: "आप Kling को सीधे होम स्क्रीन पर इंस्टॉल कर सकते हैं।",
    androidUnavailable: "अगर इंस्टॉल बटन उपलब्ध नहीं है, ब्राउज़र मेनू खोलें और Install app या Add to Home screen चुनें।",
    androidButton: "Kling इंस्टॉल करें",
    laterButton: "बाद में",
  },
  si: {
    title: "Kling ස්ථාපනය කරන්න",
    iosTitle: "iPhone මත ස්ථාපනය",
    iosSubtitle: "Share මෙනුව විවෘත කර Kling Home Screen එකට එක් කරන්න.",
    iosStepShare: "බ්‍රවුසරයේ Share බොත්තම තට්ටු කරන්න",
    iosStepHome: "Add to Home Screen තෝරන්න",
    iosStepDone: "තහවුරු කර Home Screen එකෙන් Kling විවෘත කරන්න",
    androidTitle: "Android මත ස්ථාපනය",
    androidReady: "Kling ඔබේ Home Screen එකට කෙලින්ම ස්ථාපනය කළ හැක.",
    androidUnavailable: "Install බොත්තම නොපෙන්වන්නේ නම්, browser menu එකෙන් Install app හෝ Add to Home screen තෝරන්න.",
    androidButton: "Kling ස්ථාපනය කරන්න",
    laterButton: "පසුව",
  },
  ro: {
    title: "Instalează Kling",
    iosTitle: "Instalare pe iPhone",
    iosSubtitle: "Deschide meniul de partajare și adaugă Kling pe ecranul principal.",
    iosStepShare: "Atinge butonul Share din browser",
    iosStepHome: "Alege Add to Home Screen",
    iosStepDone: "Confirmă și deschide Kling de pe ecranul principal",
    androidTitle: "Instalare pe Android",
    androidReady: "Poți instala Kling direct pe ecranul principal.",
    androidUnavailable: "Dacă butonul de instalare nu apare, deschide meniul browserului și alege Install app sau Add to Home screen.",
    androidButton: "Instalează Kling",
    laterButton: "Mai târziu",
  },
  ar: {
    title: "تثبيت Kling",
    iosTitle: "التثبيت على iPhone",
    iosSubtitle: "افتح قائمة المشاركة وأضف Kling إلى الشاشة الرئيسية.",
    iosStepShare: "اضغط زر المشاركة في المتصفح",
    iosStepHome: "اختر إضافة إلى الشاشة الرئيسية",
    iosStepDone: "أكد وافتح Kling من الشاشة الرئيسية",
    androidTitle: "التثبيت على Android",
    androidReady: "يمكنك تثبيت Kling مباشرة على الشاشة الرئيسية.",
    androidUnavailable: "إذا لم يظهر زر التثبيت، افتح قائمة المتصفح واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.",
    androidButton: "تثبيت Kling",
    laterButton: "لاحقاً",
  },
  ru: {
    title: "Установить Kling",
    iosTitle: "Установка на iPhone",
    iosSubtitle: "Откройте меню «Поделиться» и добавьте Kling на экран «Домой».",
    iosStepShare: "Нажмите кнопку «Поделиться» в браузере",
    iosStepHome: "Выберите «На экран Домой»",
    iosStepDone: "Подтвердите и откройте Kling с экрана «Домой»",
    androidTitle: "Установка на Android",
    androidReady: "Вы можете установить Kling прямо на главный экран.",
    androidUnavailable: "Если кнопка установки недоступна, откройте меню браузера и выберите Install app или Add to Home screen.",
    androidButton: "Установить Kling",
    laterButton: "Позже",
  },
  zh: {
    title: "安装 Kling",
    iosTitle: "在 iPhone 上安装",
    iosSubtitle: "打开分享菜单，将 Kling 添加到主屏幕。",
    iosStepShare: "点击浏览器中的分享按钮",
    iosStepHome: "选择添加到主屏幕",
    iosStepDone: "确认后，从主屏幕打开 Kling",
    androidTitle: "在 Android 上安装",
    androidReady: "你可以将 Kling 直接安装到主屏幕。",
    androidUnavailable: "如果没有安装按钮，请打开浏览器菜单，选择安装应用或添加到主屏幕。",
    androidButton: "安装 Kling",
    laterButton: "稍后",
  },
};

function getInviteTokenFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "invite" && parts[0] !== "join") return null;
  return parts[1] ?? null;
}

export function AuthenticatedInstallBanner() {
  const pathname = usePathname() ?? "";
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);
  const workers = useSlangStore((s) => s.workers);

  if (pathname.startsWith("/manager") || pathname.startsWith("/c/")) {
    if (!ready || !managerId || !onboardingComplete) return null;

    return (
      <InstallAppBanner
        text="עבור חווית שימוש מיטבית, הורידו את האפליקציה לנייד"
        actionLabel="התקנה"
        installLabels={MANAGER_INSTALL_LABELS}
        dir="rtl"
      />
    );
  }

  const token = getInviteTokenFromPath(pathname);
  if (!token) return null;

  const worker = workers.find((candidate) => candidate.inviteToken === token);
  if (!worker?.language || !isWorkerJoined(worker)) return null;

  const language = worker.language as LanguageCode;
  const ui = getWorkerUi(language);

  return (
    <InstallAppBanner
      text={ui.installBannerText}
      actionLabel={ui.installBannerAction}
      installLabels={WORKER_INSTALL_LABELS[language]}
      dir={getLanguageDir(language)}
    />
  );
}
