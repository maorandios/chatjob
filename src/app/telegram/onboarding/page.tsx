"use client";

import { Button } from "@/components/ui/Button";
import { LanguagePicker } from "@/components/worker/LanguagePicker";
import { TelegramInboxHeader } from "@/components/telegram/TelegramInboxHeader";
import { TelegramShell } from "@/components/telegram/TelegramShell";
import {
  TelegramLoading,
  TelegramMessageScreen,
} from "@/components/telegram/TelegramStatus";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useTelegramBootstrap } from "@/lib/hooks/use-telegram-bootstrap";
import { useClientSearchParam } from "@/lib/mock/use-client-search-param";
import { useSlangStore } from "@/lib/store";
import type { LanguageCode } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TelegramOnboardingPage() {
  const router = useRouter();
  const isChangingLanguage = useClientSearchParam("changeLang");
  const { appReady, session, worker, error, isTelegram } = useTelegramBootstrap();
  const setWorkerLanguage = useSlangStore((s) => s.setWorkerLanguage);

  const [selectedLang, setSelectedLang] = useState<LanguageCode | undefined>(
    worker?.language
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  if (!isTelegram) {
    return (
      <TelegramMessageScreen title="Kling Telegram">
        <p>פתחו את העמוד מתוך Telegram.</p>
      </TelegramMessageScreen>
    );
  }

  if (error) {
    return (
      <TelegramMessageScreen title="שגיאה">
        <p>{error}</p>
      </TelegramMessageScreen>
    );
  }

  if (!appReady || session?.role !== "worker" || !worker) {
    return <TelegramLoading />;
  }

  const previewLang = selectedLang ?? worker.language ?? "en";
  const ui = getWorkerUi(previewLang);
  const dir = getLanguageDir(previewLang);

  const handleContinue = async () => {
    if (!selectedLang) return;
    setIsSaving(true);
    setSaveError(undefined);
    try {
      await setWorkerLanguage(worker.id, selectedLang);
      router.replace("/telegram/inbox");
    } catch (err) {
      console.error("[Telegram] Failed to set language", err);
      setSaveError(ui.saveLanguageFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TelegramShell dir={dir}>
      <TelegramInboxHeader
        title={isChangingLanguage ? ui.changeLanguage : ui.chooseLanguage}
        subtitle={ui.chooseLanguageSubtitle}
        dir={dir}
      />

      <div className="chat-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
        <LanguagePicker selected={selectedLang} onSelect={setSelectedLang} />
        {saveError && (
          <p className="mt-4 text-center text-sm text-red-600">{saveError}</p>
        )}
      </div>

      <div
        className="safe-bottom shrink-0 border-t px-4 py-3"
        style={{
          borderColor: "var(--tg-theme-hint-color, var(--jobchat-border))",
          backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
        }}
      >
        <Button
          type="button"
          className="w-full"
          disabled={!selectedLang || isSaving}
          onClick={() => void handleContinue()}
        >
          {isSaving ? ui.saving : ui.continue}
        </Button>
      </div>
    </TelegramShell>
  );
}
