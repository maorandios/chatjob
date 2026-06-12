"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { WorkerSettingsSheet } from "@/components/worker/WorkerSettingsSheet";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { getQuickReplyPhrases } from "@/lib/mock/translations";
import { useInviteByToken, useWorkerByToken } from "@/lib/mock/store";
import type { LanguageCode } from "@/types";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default function WorkerChatPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const worker = useWorkerByToken(token);
  const invite = useInviteByToken(token);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (worker && !worker.language) {
      router.replace(`/invite/${token}`);
    }
  }, [worker, token, router]);

  if (!worker || !invite) notFound();

  if (!worker.language) {
    return null;
  }

  const lang = worker.language as LanguageCode;
  const ui = getWorkerUi(lang);
  const dir = getLanguageDir(lang);
  const quickReplies = getQuickReplyPhrases(lang);

  return (
    <MobileFrame dir={dir}>
      <div className="flex min-h-dvh flex-col">
        <ChatHeader
          name={invite.managerName}
          subtitle={ui.active}
          onAvatarClick={() => setShowSettings(true)}
          dir={dir}
          hideBack
        />
        <ChatThread
          workerId={worker.id}
          viewerRole="worker"
          workerLanguage={lang}
          translationCaption={ui.translatedFromHebrew}
          emptyHint={`${ui.sendMessageTo} ${invite.managerName}`}
          quickReplies={quickReplies}
          composerPlaceholder={ui.messagePlaceholder}
          processingLabel={ui.sending}
          recordingLabel={ui.recording}
          micErrorLabel={ui.micError}
          sendFailedLabel={ui.sendFailed}
          voiceConfirmTitle={ui.voiceConfirmTitle}
          voiceConfirmYouSaid={ui.voiceConfirmYouSaid}
          voiceConfirmEditHint={ui.voiceConfirmEditHint}
          voiceConfirmSend={ui.voiceConfirmSend}
          voiceConfirmRerecord={ui.voiceConfirmRerecord}
          recordingTooShortLabel={ui.recordingTooShort}
          dir={dir}
          largeComposer
        />
      </div>

      <WorkerSettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        workerName={worker.name}
        language={lang}
        dir={dir}
        onChangeLanguage={() => {
          setShowSettings(false);
          router.push(`/invite/${token}?changeLang=1`);
        }}
      />
    </MobileFrame>
  );
}
