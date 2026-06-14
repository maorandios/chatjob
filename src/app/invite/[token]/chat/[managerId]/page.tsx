"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { ContactNameSheet } from "@/components/chat/ContactNameSheet";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { useChatData, useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { getQuickReplyPhrases } from "@/lib/mock/translations";
import {
  useContactDisplayName,
  useManagerById,
  useSlangStore,
} from "@/lib/store";
import type { LanguageCode } from "@/types";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkerChatPage() {
  const params = useParams<{ token: string; managerId: string }>();
  const token = params?.token ?? "";
  const managerId = params?.managerId ?? "";
  const router = useRouter();
  const { loading, worker, invite } = useInviteBootstrap(token);
  const manager = useManagerById(managerId);
  const setContactAlias = useSlangStore((s) => s.setContactAlias);
  const [showContactSheet, setShowContactSheet] = useState(false);

  useChatData(managerId, worker?.id);

  useEffect(() => {
    if (worker && !worker.language) {
      router.replace(`/invite/${token}`);
    }
  }, [worker, token, router]);

  const displayName = useContactDisplayName(
    "worker",
    managerId,
    manager?.name ?? ""
  );

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </MobileFrame>
    );
  }

  if (!token || !worker || !invite || !managerId || !manager) notFound();

  if (!worker.language) {
    return null;
  }

  const lang = worker.language as LanguageCode;
  const ui = getWorkerUi(lang);
  const dir = getLanguageDir(lang);
  const quickReplies = getQuickReplyPhrases(lang);

  return (
    <MobileFrame dir={dir}>
      <ChatHeader
        name={displayName}
        subtitle={manager.phone}
        backHref={`/invite/${token}`}
        settingsHref={`/invite/${token}/settings`}
        dir={dir}
        showOnline={false}
        onProfileClick={() => setShowContactSheet(true)}
      />
      <ChatThread
        managerId={managerId}
        workerId={worker.id}
        viewerRole="worker"
        workerLanguage={lang}
        emptyHint={`${ui.sendMessageTo} ${displayName}`}
        quickReplies={quickReplies}
        composerPlaceholder={ui.messagePlaceholder}
        processingLabel={ui.sending}
        analyzingLabel={ui.analyzingVoice}
        recordingLabel={ui.recording}
        finishRecordingLabel={ui.finishRecording}
        deleteRecordingLabel={ui.deleteRecording}
        maxDurationLabel={ui.maxDurationRecording}
        micErrorLabel={ui.micError}
        sendFailedLabel={ui.sendFailed}
        voiceConfirmTitle={ui.voiceConfirmTitle}
        voiceConfirmYouSaid={ui.voiceConfirmYouSaid}
        voiceConfirmSend={ui.voiceConfirmSend}
        voiceConfirmRerecord={ui.voiceConfirmRerecord}
        recordingTooShortLabel={ui.recordingTooShort}
        attachImageTitle={ui.attachImageTitle}
        takePhotoLabel={ui.takePhotoLabel}
        chooseGalleryLabel={ui.chooseGalleryLabel}
        imageSendFailedLabel={ui.imageSendFailed}
        dir={dir}
        largeComposer
      />

      <ContactNameSheet
        open={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        originalName={manager.name}
        displayName={displayName}
        onSave={(name) => setContactAlias("worker", managerId, name)}
        title={ui.contactNameTitle}
        originalLabel={ui.contactNameOriginal}
        placeholder={ui.contactNamePlaceholder}
        saveLabel={ui.contactNameSave}
        dir={dir}
      />
    </MobileFrame>
  );
}
