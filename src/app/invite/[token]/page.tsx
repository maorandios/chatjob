"use client";

import { Button } from "@/components/ui/Button";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { LanguagePicker } from "@/components/worker/LanguagePicker";
import { WorkerChatListItem } from "@/components/worker/WorkerChatListItem";
import { WorkerSettingsSheet } from "@/components/worker/WorkerSettingsSheet";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useClientSearchParam } from "@/lib/mock/use-client-search-param";
import {
  useInviteByToken,
  useJobChatStore,
  useWorkerByToken,
} from "@/lib/mock/store";
import type { LanguageCode } from "@/types";
import { Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();

  return <InvitePageContent token={token} />;
}

function WorkerHome({
  token,
  workerId,
  managerName,
  language,
}: {
  token: string;
  workerId: string;
  managerName: string;
  language: LanguageCode;
}) {
  const router = useRouter();
  const worker = useWorkerByToken(token);
  const ui = getWorkerUi(language);
  const dir = getLanguageDir(language);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <MobileFrame dir={dir}>
      <header className="safe-top shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">JobChat</h1>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full text-gray-700 active:bg-[var(--jobchat-surface)]"
            aria-label={ui.settings}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)]">
        <WorkerChatListItem
          inviteToken={token}
          workerId={workerId}
          managerName={managerName}
          workerLanguage={language}
          emptyPreview={ui.noMessagesYet}
        />
      </div>

      <WorkerSettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        workerName={worker?.name ?? ""}
        language={language}
        dir={dir}
        onChangeLanguage={() => {
          setShowSettings(false);
          router.push(`/invite/${token}?changeLang=1`);
        }}
      />
    </MobileFrame>
  );
}

function InviteOnboarding({ token }: { token: string }) {
  const router = useRouter();
  const isChangingLanguage = useClientSearchParam("changeLang");
  const setWorkerLanguage = useJobChatStore((s) => s.setWorkerLanguage);
  const worker = useWorkerByToken(token);
  const invite = useInviteByToken(token);

  const [selectedLang, setSelectedLang] = useState<LanguageCode | undefined>(
    worker?.language
  );

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

  const previewLang = selectedLang ?? worker.language ?? "en";
  const ui = getWorkerUi(previewLang);
  const dir = getLanguageDir(previewLang);

  const handleContinue = () => {
    if (!selectedLang) return;
    setWorkerLanguage(worker.id, selectedLang);
    router.push(`/invite/${token}`);
  };

  return (
    <MobileFrame dir={dir}>
      <div className="safe-top flex min-h-0 flex-1 flex-col px-5 pb-6 pt-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--jobchat-accent)] text-lg font-bold text-white">
            JC
          </div>
          <p className="text-sm text-gray-500">{ui.invitedBy}</p>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">
            {invite.managerName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{ui.invitedToJobChat}</p>
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
          <Button fullWidth disabled={!selectedLang} onClick={handleContinue}>
            {selectedLang ? ui.joinChat : ui.continue}
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
}

function InvitePageContent({ token }: { token: string }) {
  const isChangingLanguage = useClientSearchParam("changeLang");
  const worker = useWorkerByToken(token);
  const invite = useInviteByToken(token);

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
        managerName={invite.managerName}
        language={worker.language as LanguageCode}
      />
    );
  }

  return <InviteOnboarding token={token} />;
}
