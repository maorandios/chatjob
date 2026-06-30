"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatLoadingState } from "@/components/chat/ChatLoadingState";
import { ChatThread } from "@/components/chat/ChatThread";
import { ContactNameSheet } from "@/components/chat/ContactNameSheet";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { getQuickReplyPhrases } from "@/lib/mock/translations";
import {
  useContactDisplayName,
  useContactDisplayPhone,
  useManagerById,
  useSlangStore,
} from "@/lib/store";
import { getWorkerJoinPath } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkerChatPage() {
  const params = useParams<{ token: string; managerId: string }>();
  const token = params?.token ?? "";
  const managerId = params?.managerId ?? "";
  const router = useRouter();
  const { loading, worker, invite, authRequired } = useInviteBootstrap(token);
  const manager = useManagerById(managerId);
  const setContactAlias = useSlangStore((s) => s.setContactAlias);
  const [showContactSheet, setShowContactSheet] = useState(false);

  useEffect(() => {
    if (authRequired) {
      router.replace(getWorkerJoinPath(token));
      return;
    }
    if (worker && !worker.language) {
      router.replace(getWorkerJoinPath(token));
    }
    if (!loading && token && (!worker || !invite || !managerId || !manager)) {
      router.replace(getWorkerJoinPath(token));
    }
  }, [authRequired, worker, invite, managerId, manager, loading, token, router]);

  const displayName = useContactDisplayName(
    "worker",
    managerId,
    manager?.name ?? ""
  );
  const displayPhone = useContactDisplayPhone(
    "worker",
    managerId,
    manager?.phone ?? ""
  );

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex min-h-0 flex-1 items-center bg-[var(--jobchat-surface)]">
          <ChatLoadingState />
        </div>
      </MobileFrame>
    );
  }

  if (!token || !worker || !invite || !managerId || !manager) {
    return (
      <MobileFrame>
        <div className="flex min-h-0 flex-1 items-center bg-[var(--jobchat-surface)]">
          <ChatLoadingState />
        </div>
      </MobileFrame>
    );
  }

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
        subtitle={displayPhone}
        imageUrl={manager.profileImageUrl}
        backHref={getWorkerJoinPath(token)}
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
        recordingReadyLabel={ui.recordingReady}
        finishRecordingLabel={ui.finishRecording}
        deleteRecordingLabel={ui.deleteRecording}
        maxDurationLabel={ui.maxDurationRecording}
        micErrorLabel={ui.micError}
        sendFailedLabel={ui.sendFailed}
        voiceConfirmTitle={ui.voiceConfirmTitle}
        voiceConfirmYouSaid={ui.voiceConfirmYouSaid}
        voiceConfirmSend={ui.voiceConfirmSend}
        voiceConfirmRerecord={ui.voiceConfirmRerecord}
        voiceConfirmCancel={ui.cancel}
        recordingTooShortLabel={ui.recordingTooShort}
        attachImageTitle={ui.attachImageTitle}
        takePhotoLabel={ui.takePhotoLabel}
        chooseGalleryLabel={ui.chooseGalleryLabel}
        shareLocationLabel={ui.shareLocationLabel}
        locationBubbleLabel={ui.shareLocationLabel}
        imageSendFailedLabel={ui.imageSendFailed}
        locationSendFailedLabel={ui.locationSendFailed}
        locationInstructionsLabels={{
          title: ui.locationSettingsSheetTitle,
          body: ui.locationSettingsSheetBody,
          iosTitle: ui.locationSettingsIosTitle,
          iosSteps: ui.locationSettingsIosSteps,
          androidTitle: ui.locationSettingsAndroidTitle,
          androidSteps: ui.locationSettingsAndroidSteps,
          desktopTitle: ui.locationSettingsDesktopTitle,
          desktopSteps: ui.locationSettingsDesktopSteps,
          close: ui.cancel,
        }}
        dir={dir}
        largeComposer
      />

      <ContactNameSheet
        open={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        originalPhone={manager.phone}
        displayName={displayName}
        displayPhone={displayPhone}
        email={manager.email}
        onSave={(profile) =>
          setContactAlias("worker", managerId, {
            name: profile.name === manager.name ? "" : profile.name,
            phone: profile.phone === manager.phone ? "" : profile.phone,
          }, { ownerId: worker.id, contactRole: "manager" })
        }
        namePlaceholder={ui.contactNamePlaceholder}
        phonePlaceholder={ui.contactPhonePlaceholder}
        saveLabel={ui.contactNameSave}
        phoneCopiedLabel={ui.contactPhoneCopied}
        dir={dir}
      />
    </MobileFrame>
  );
}
