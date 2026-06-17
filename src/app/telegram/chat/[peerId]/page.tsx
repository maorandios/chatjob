"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { ContactNameSheet } from "@/components/chat/ContactNameSheet";
import { WorkerProfileSheet } from "@/components/chat/WorkerProfileSheet";
import { TelegramShell } from "@/components/telegram/TelegramShell";
import {
  TelegramLoading,
  TelegramMessageScreen,
} from "@/components/telegram/TelegramStatus";
import { useTelegramBackButton } from "@/lib/hooks/use-telegram-back-button";
import { useTelegramBootstrap } from "@/lib/hooks/use-telegram-bootstrap";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { getQuickReplyPhrases } from "@/lib/mock/translations";
import {
  useContactDisplayName,
  useContactDisplayPhone,
  useManagerById,
  useSlangStore,
  useWorkerById,
} from "@/lib/store";
import type { LanguageCode } from "@/types";
import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function TelegramChatPage() {
  const params = useParams<{ peerId: string }>();
  const peerId = params?.peerId ?? "";
  const router = useRouter();
  const { appReady, session, worker, managerId, error, isTelegram } =
    useTelegramBootstrap();

  const setContactAlias = useSlangStore((s) => s.setContactAlias);
  const updateWorkerProfile = useSlangStore((s) => s.updateWorkerProfile);
  const [showContactSheet, setShowContactSheet] = useState(false);

  const goBack = useCallback(() => {
    router.push("/telegram/inbox");
  }, [router]);

  useTelegramBackButton(goBack, true);

  const isManagerView = session?.role === "manager";
  const isWorkerView = session?.role === "worker";

  const resolvedWorkerId = isManagerView ? peerId : worker?.id ?? "";
  const resolvedManagerId = isWorkerView ? peerId : managerId ?? "";

  const chatWorker = useWorkerById(resolvedWorkerId);
  const chatManager = useManagerById(resolvedManagerId);

  const managerViewName = useContactDisplayName(
    "manager",
    chatWorker?.id ?? "",
    chatWorker?.name ?? ""
  );
  const managerViewPhone = useContactDisplayPhone(
    "manager",
    chatWorker?.id ?? "",
    chatWorker?.phone ?? ""
  );
  const workerViewName = useContactDisplayName(
    "worker",
    chatManager?.id ?? "",
    chatManager?.name ?? ""
  );
  const workerViewPhone = useContactDisplayPhone(
    "worker",
    chatManager?.id ?? "",
    chatManager?.phone ?? ""
  );

  useEffect(() => {
    if (isManagerView && chatWorker?.status === "pending") {
      router.replace("/telegram/inbox");
    }
  }, [isManagerView, chatWorker?.status, router]);

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

  if (!appReady || !session || session.role === "unknown") {
    return <TelegramLoading />;
  }

  if (!peerId) notFound();

  if (isManagerView) {
    if (!managerId || !chatWorker || chatWorker.status === "pending") {
      return <TelegramLoading />;
    }

    return (
      <TelegramShell dir="rtl">
        <ChatHeader
          name={managerViewName}
          subtitle={managerViewPhone}
          onBack={goBack}
          dir="rtl"
          showOnline={false}
          variant="telegram"
          onProfileClick={() => setShowContactSheet(true)}
        />
        <ChatThread
          managerId={managerId}
          workerId={chatWorker.id}
          viewerRole="manager"
          workerLanguage={chatWorker.language}
          composerPlaceholder="כתוב הודעה"
          processingLabel="שולח..."
          analyzingLabel="ממיר הקלטה לטקסט"
          recordingLabel="מקליט..."
          finishRecordingLabel="סיים"
          deleteRecordingLabel="מחק"
          maxDurationLabel="הגעת למקסימום 20 שניות"
          micErrorLabel="לא ניתן לגשת למיקרופון"
          sendFailedLabel="שליחה נכשלה"
          recordingTooShortLabel="הקלטה קצרה מדי — נסה שוב"
          dir="rtl"
        />
        <WorkerProfileSheet
          open={showContactSheet}
          onClose={() => setShowContactSheet(false)}
          displayName={managerViewName}
          displayPhone={managerViewPhone}
          copyPhone={chatWorker.phone}
          employeeNumber={chatWorker.employeeNumber}
          address={chatWorker.address}
          onSave={(profile) => updateWorkerProfile(chatWorker.id, profile)}
          phoneCopiedLabel="מספר טלפון הועתק"
          dir="rtl"
        />
      </TelegramShell>
    );
  }

  if (isWorkerView && worker?.language && chatManager) {
    const lang = worker.language as LanguageCode;
    const ui = getWorkerUi(lang);
    const dir = getLanguageDir(lang);
    const quickReplies = getQuickReplyPhrases(lang);

    return (
      <TelegramShell dir={dir}>
        <ChatHeader
          name={workerViewName}
          subtitle={workerViewPhone}
          onBack={goBack}
          dir={dir}
          showOnline={false}
          variant="telegram"
          onProfileClick={() => setShowContactSheet(true)}
        />
        <ChatThread
          managerId={chatManager.id}
          workerId={worker.id}
          viewerRole="worker"
          workerLanguage={lang}
          emptyHint={`${ui.sendMessageTo} ${workerViewName}`}
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
          originalPhone={chatManager.phone}
          displayName={workerViewName}
          displayPhone={workerViewPhone}
          onSave={(profile) =>
            setContactAlias("worker", chatManager.id, {
              name: profile.name === chatManager.name ? "" : profile.name,
              phone: profile.phone === chatManager.phone ? "" : profile.phone,
            })
          }
          namePlaceholder={ui.contactNamePlaceholder}
          phonePlaceholder={ui.contactPhonePlaceholder}
          saveLabel={ui.contactNameSave}
          phoneCopiedLabel={ui.contactPhoneCopied}
          dir={dir}
        />
      </TelegramShell>
    );
  }

  if (isWorkerView && worker?.language) {
    notFound();
  }

  return <TelegramLoading />;
}
