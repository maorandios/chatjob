"use client";

import { Composer } from "@/components/chat/Composer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { QuickReplies } from "@/components/chat/QuickReplies";
import { VoiceConfirmSheet } from "@/components/chat/VoiceConfirmSheet";
import { Portal } from "@/components/ui/Portal";
import { useToast } from "@/components/ui/Toast";
import {
  sendTextMessage,
  transcribeVoiceMessage,
  type VoiceTranscription,
} from "@/lib/api/messages";
import {
  getMessageDisplayText,
  useJobChatStore,
  useWorkerMessages,
} from "@/lib/mock/store";
import { buildTranslationContext } from "@/lib/translation/context";
import type { LanguageCode, Message } from "@/types";
import { useEffect, useRef, useState } from "react";

type ChatThreadProps = {
  workerId: string;
  viewerRole: "manager" | "worker";
  workerLanguage?: LanguageCode;
  emptyHint?: string;
  quickReplies?: string[];
  composerPlaceholder?: string;
  processingLabel?: string;
  analyzingLabel?: string;
  recordingLabel?: string;
  finishRecordingLabel?: string;
  deleteRecordingLabel?: string;
  maxDurationLabel?: string;
  micErrorLabel?: string;
  sendFailedLabel?: string;
  voiceConfirmTitle?: string;
  voiceConfirmYouSaid?: string;
  voiceConfirmSend?: string;
  voiceConfirmRerecord?: string;
  recordingTooShortLabel?: string;
  attachImageTitle?: string;
  takePhotoLabel?: string;
  chooseGalleryLabel?: string;
  imageSendFailedLabel?: string;
  dir?: "ltr" | "rtl";
  largeComposer?: boolean;
};

export function ChatThread({
  workerId,
  viewerRole,
  workerLanguage,
  emptyHint,
  quickReplies,
  composerPlaceholder = "כתוב הודעה",
  processingLabel,
  analyzingLabel,
  recordingLabel,
  finishRecordingLabel,
  deleteRecordingLabel,
  maxDurationLabel,
  micErrorLabel,
  sendFailedLabel,
  voiceConfirmTitle = "אישור הודעה קולית",
  voiceConfirmYouSaid = "המרת הקלטה לטקסט",
  voiceConfirmSend = "שלח הודעה",
  voiceConfirmRerecord = "הקלטה חוזרת",
  recordingTooShortLabel = "הקלטה קצרה מדי — נסה שוב",
  attachImageTitle = "שליחת תמונה",
  takePhotoLabel = "צלם תמונה",
  chooseGalleryLabel = "בחר מהגלריה",
  imageSendFailedLabel = "שליחת התמונה נכשלה",
  dir = "rtl",
  largeComposer = false,
}: ChatThreadProps) {
  const messages = useWorkerMessages(workerId);
  const sendMessage = useJobChatStore((s) => s.sendMessage);
  const sendImageMessage = useJobChatStore((s) => s.sendImageMessage);
  const commitProcessedMessage = useJobChatStore((s) => s.commitProcessedMessage);
  const markManagerMessagesRead = useJobChatStore((s) => s.markManagerMessagesRead);
  const markWorkerMessagesRead = useJobChatStore((s) => s.markWorkerMessagesRead);
  const { showToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [voicePreview, setVoicePreview] = useState<VoiceTranscription | null>(null);
  const [isConfirmingVoice, setIsConfirmingVoice] = useState(false);

  const hasUnreadManagerMessages = messages.some(
    (m) => m.senderRole === "manager" && m.status === "sent"
  );
  const hasUnreadWorkerMessages = messages.some(
    (m) => m.senderRole === "worker" && m.status === "sent"
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (viewerRole !== "worker" || !hasUnreadManagerMessages) return;
    markManagerMessagesRead(workerId);
  }, [viewerRole, workerId, hasUnreadManagerMessages, markManagerMessagesRead]);

  useEffect(() => {
    if (viewerRole !== "manager" || !hasUnreadWorkerMessages) return;
    markWorkerMessagesRead(workerId);
  }, [viewerRole, workerId, hasUnreadWorkerMessages, markWorkerMessagesRead]);

  const getContext = () => buildTranslationContext(messages);

  const handleSend = async (text: string) => {
    try {
      await sendMessage(
        workerId,
        viewerRole,
        text,
        workerLanguage,
        getContext()
      );
    } catch {
      showToast(sendFailedLabel ?? "שליחה נכשלה");
    }
  };

  const handleImageSend = async (file: File) => {
    try {
      await sendImageMessage(workerId, viewerRole, file);
    } catch {
      showToast(imageSendFailedLabel);
    }
  };

  const handleVoiceRecorded = async (blob: Blob) => {
    const result = await transcribeVoiceMessage(blob, viewerRole, workerLanguage);
    setVoicePreview(result);
  };

  const handleVoiceConfirm = async (editedTranscript: string) => {
    if (!voicePreview) return;
    setIsConfirmingVoice(true);
    try {
      const result = await sendTextMessage(
        editedTranscript,
        viewerRole,
        workerLanguage,
        {
          originalLang: voicePreview.originalLang,
          lockSourceLang: viewerRole === "manager",
          context: getContext(),
          inputType: "voice",
        }
      );
      commitProcessedMessage(workerId, viewerRole, result);
      setVoicePreview(null);
    } catch {
      showToast(sendFailedLabel ?? "שליחה נכשלה");
    } finally {
      setIsConfirmingVoice(false);
    }
  };

  const showQuickReplies =
    viewerRole === "worker" && messages.length === 0 && quickReplies?.length;

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--quick-replies-height",
      showQuickReplies ? "3.5rem" : "0px"
    );
    return () => {
      document.documentElement.style.setProperty("--quick-replies-height", "0px");
    };
  }, [showQuickReplies]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="chat-scrollbar flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-4 pb-[calc(var(--composer-height,5.5rem)+var(--quick-replies-height,0px))]">
        {messages.length === 0 && emptyHint && (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-gray-500">{emptyHint}</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((message: Message) => {
            const isOwn = message.senderRole === viewerRole;
            const displayText = getMessageDisplayText(
              message,
              viewerRole,
              workerLanguage
            );

            return (
              <MessageBubble
                key={message.id}
                message={message}
                displayText={displayText}
                isOwn={isOwn}
                showStatus={isOwn}
              />
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {showQuickReplies && (
        <Portal>
          <div
            className="fixed inset-x-0 z-[39] border-t border-[var(--jobchat-border)] bg-white"
            style={{
              bottom:
                "calc(var(--composer-height, 5.5rem) + var(--keyboard-inset, 0px))",
            }}
          >
            <div className="mx-auto w-full max-w-[430px]">
              <QuickReplies
                replies={quickReplies!}
                onSelect={(text) => void handleSend(text)}
              />
            </div>
          </div>
        </Portal>
      )}

      <Composer
        onSend={handleSend}
        onVoiceSend={handleVoiceRecorded}
        onImageSend={handleImageSend}
        placeholder={composerPlaceholder}
        processingLabel={processingLabel}
        analyzingLabel={analyzingLabel}
        recordingLabel={recordingLabel}
        finishRecordingLabel={finishRecordingLabel}
        deleteRecordingLabel={deleteRecordingLabel}
        maxDurationLabel={maxDurationLabel}
        micErrorLabel={micErrorLabel}
        tooShortLabel={recordingTooShortLabel}
        attachImageTitle={attachImageTitle}
        takePhotoLabel={takePhotoLabel}
        chooseGalleryLabel={chooseGalleryLabel}
        imageSendFailedLabel={imageSendFailedLabel}
        large={largeComposer}
        dir={dir}
        disabled={!!voicePreview || isConfirmingVoice}
      />

      <VoiceConfirmSheet
        open={!!voicePreview}
        transcript={voicePreview?.originalText ?? ""}
        title={voiceConfirmTitle}
        youSaidLabel={voiceConfirmYouSaid}
        sendLabel={voiceConfirmSend}
        rerecordLabel={voiceConfirmRerecord}
        isSending={isConfirmingVoice}
        onSend={handleVoiceConfirm}
        onRerecord={() => setVoicePreview(null)}
        dir={dir}
      />
    </div>
  );
}
