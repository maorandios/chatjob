"use client";

import { AppListHeader } from "@/components/settings/AppListHeader";
import { Button } from "@/components/ui/Button";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { LanguagePicker } from "@/components/worker/LanguagePicker";
import { ManagerChatListItem } from "@/components/worker/ManagerChatListItem";
import { useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useClientSearchParam } from "@/lib/mock/use-client-search-param";
import { useSlangStore } from "@/lib/store";
import type { LanguageCode } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  if (!token) return null;

  return <InvitePageContent token={token} />;
}

function WorkerHome({
  token,
  workerId,
  companyName,
  language,
}: {
  token: string;
  workerId: string;
  companyName: string;
  language: LanguageCode;
}) {
  const managers = useSlangStore((s) => s.managers);
  const ui = getWorkerUi(language);
  const dir = getLanguageDir(language);

  return (
    <MobileFrame dir={dir}>
      <AppListHeader settingsHref={`/invite/${token}/settings`} />

      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)]">
        {managers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <p className="text-sm text-gray-500">{companyName}</p>
            <p className="mt-2 text-base font-medium text-gray-900">
              אין מנהלים זמינים עדיין
            </p>
          </div>
        ) : (
          managers.map((manager) => (
            <ManagerChatListItem
              key={manager.id}
              inviteToken={token}
              workerId={workerId}
              manager={manager}
              workerLanguage={language}
              emptyPreview={ui.noMessagesYet}
            />
          ))
        )}
      </div>
    </MobileFrame>
  );
}

function InviteOnboarding({
  token,
  worker,
  companyName,
}: {
  token: string;
  worker: { id: string; language?: LanguageCode };
  companyName: string;
}) {
  const router = useRouter();
  const isChangingLanguage = useClientSearchParam("changeLang");
  const setWorkerLanguage = useSlangStore((s) => s.setWorkerLanguage);

  const [selectedLang, setSelectedLang] = useState<LanguageCode | undefined>(
    worker.language
  );
  const [isSaving, setIsSaving] = useState(false);

  const previewLang = selectedLang ?? worker.language ?? "en";
  const ui = getWorkerUi(previewLang);
  const dir = getLanguageDir(previewLang);

  const handleContinue = async () => {
    if (!selectedLang) return;
    setIsSaving(true);
    try {
      await setWorkerLanguage(worker.id, selectedLang);
      router.push(`/invite/${token}`);
    } catch (error) {
      console.error("[Slang] Failed to set language", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileFrame dir={dir}>
      <div className="safe-top flex min-h-0 flex-1 flex-col px-5 pb-6 pt-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--jobchat-accent)] text-lg font-bold text-white">
            S
          </div>
          <p className="text-sm text-gray-500">{ui.invitedBy}</p>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">
            {companyName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{ui.invitedToSlang}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isChangingLanguage ? ui.changeLanguage : ui.chooseLanguage}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {ui.chooseLanguageSubtitle}
          </p>
        </div>

        <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto">
          <LanguagePicker selected={selectedLang} onSelect={setSelectedLang} />
        </div>

        <div className="mt-6 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
          <Button
            fullWidth
            disabled={!selectedLang || isSaving}
            onClick={() => void handleContinue()}
          >
            {selectedLang ? ui.joinChat : ui.continue}
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
}

function InvitePageContent({ token }: { token: string }) {
  const isChangingLanguage = useClientSearchParam("changeLang");
  const { loading, worker, invite } = useInviteBootstrap(token);

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </MobileFrame>
    );
  }

  if (!worker || !invite) {
    return (
      <MobileFrame>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">הזמנה לא תקינה</h1>
          <p className="mt-2 text-sm text-gray-500">קישור ההזמנה אינו פעיל</p>
        </div>
      </MobileFrame>
    );
  }

  const showHome =
    worker.language && worker.status === "active" && !isChangingLanguage;

  if (showHome) {
    return (
      <WorkerHome
        token={token}
        workerId={worker.id}
        companyName={invite.companyName}
        language={worker.language as LanguageCode}
      />
    );
  }

  return (
    <InviteOnboarding
      token={token}
      worker={worker}
      companyName={invite.companyName}
    />
  );
}
