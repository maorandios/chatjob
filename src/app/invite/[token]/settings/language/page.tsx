"use client";

import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { Button } from "@/components/ui/Button";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { LanguagePicker } from "@/components/worker/LanguagePicker";
import { useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useSlangStore } from "@/lib/store";
import { getWorkerJoinPath, getWorkerSettingsPath } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkerSettingsLanguagePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();
  const { loading, worker, authRequired } = useInviteBootstrap(token);
  const setWorkerLanguage = useSlangStore((s) => s.setWorkerLanguage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (authRequired) {
      router.replace(getWorkerJoinPath(token));
    }
  }, [authRequired, router, token]);

  if (!token) notFound();

  if (loading) {
    return (
      <MobileFrame>
        <AppLoadingState />
      </MobileFrame>
    );
  }

  if (!worker?.language) notFound();

  const language = worker.language as LanguageCode;
  const dir = getLanguageDir(language);
  const ui = getWorkerUi(language);

  const handleSelect = async (nextLanguage: LanguageCode) => {
    if (saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await setWorkerLanguage(worker.id, nextLanguage);
      router.replace(getWorkerSettingsPath(token));
    } catch (err) {
      console.error("[Slang] Failed to set worker language", err);
      setError(ui.saveLanguageFailed);
      setSaving(false);
    }
  };

  return (
    <MobileFrame dir={dir}>
      <SettingsScreenHeader
        title={ui.changeLanguage}
        backHref={getWorkerSettingsPath(token)}
        dir={dir}
      />
      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-5">
        <LanguagePicker selected={language} onSelect={(code) => void handleSelect(code)} />
        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
        {saving && (
          <Button fullWidth disabled className="mt-5 !rounded-2xl">
            {ui.saving}
          </Button>
        )}
      </div>
    </MobileFrame>
  );
}
