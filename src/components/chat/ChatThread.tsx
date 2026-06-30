"use client";

import { ChatLoadingState } from "@/components/chat/ChatLoadingState";
import { Composer } from "@/components/chat/Composer";
import type { LocationInstructionsLabels } from "@/components/chat/LocationInstructionsSheet";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { QuickReplies } from "@/components/chat/QuickReplies";
import { VoiceConfirmSheet } from "@/components/chat/VoiceConfirmSheet";
import { useToast } from "@/components/ui/Toast";
import {
  sendTextMessage,
  transcribeVoiceMessage,
  type VoiceTranscription,
} from "@/lib/api/messages";
import {
  getMessageDisplayText,
  useSlangStore,
  useConversationMessages,
} from "@/lib/store";
import { useChatData } from "@/lib/hooks/use-slang-data";
import { buildTranslationContext } from "@/lib/translation/context";
import type { LanguageCode, Message } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

type ChatThreadProps = {
  managerId: string;
  workerId: string;
  viewerRole: "manager" | "worker";
  workerLanguage?: LanguageCode;
  emptyHint?: string;
  quickReplies?: string[];
  composerPlaceholder?: string;
  processingLabel?: string;
  analyzingLabel?: string;
  recordingLabel?: string;
  recordingReadyLabel?: string;
  finishRecordingLabel?: string;
  deleteRecordingLabel?: string;
  maxDurationLabel?: string;
  micErrorLabel?: string;
  sendFailedLabel?: string;
  voiceConfirmTitle?: string;
  voiceConfirmYouSaid?: string;
  voiceConfirmSend?: string;
  voiceConfirmRerecord?: string;
  voiceConfirmCancel?: string;
  recordingTooShortLabel?: string;
  attachImageTitle?: string;
  takePhotoLabel?: string;
  chooseGalleryLabel?: string;
  shareLocationLabel?: string;
  locationBubbleLabel?: string;
  imageSendFailedLabel?: string;
  locationSendFailedLabel?: string;
  locationInstructionsLabels?: Partial<LocationInstructionsLabels>;
  dir?: "ltr" | "rtl";
  largeComposer?: boolean;
};

export function ChatThread({
  managerId,
  workerId,
  viewerRole,
  workerLanguage,
  emptyHint,
  quickReplies,
  composerPlaceholder = "כתוב הודעה",
  processingLabel,
  analyzingLabel,
  recordingLabel,
  recordingReadyLabel = "הקלטה מוכנה",
  finishRecordingLabel,
  deleteRecordingLabel,
  maxDurationLabel,
  micErrorLabel,
  sendFailedLabel,
  voiceConfirmTitle = "אישור הודעה קולית",
  voiceConfirmYouSaid = "המרת הקלטה לטקסט",
  voiceConfirmSend = "שלח הודעה",
  voiceConfirmCancel = "ביטול",
  recordingTooShortLabel = "הקלטה קצרה מדי — נסה שוב",
  attachImageTitle = "שליחת תמונה",
  takePhotoLabel = "צלם תמונה",
  chooseGalleryLabel = "בחר מהגלריה",
  shareLocationLabel = "שתף מיקום",
  locationBubbleLabel = "שיתוף מיקום",
  imageSendFailedLabel = "שליחת התמונה נכשלה",
  locationSendFailedLabel = "שליחת המיקום נכשלה",
  locationInstructionsLabels,
  dir = "rtl",
  largeComposer = false,
}: ChatThreadProps) {
  const { loading, hasMore, loadingOlder, loadOlder } = useChatData(
    managerId,
    workerId,
    viewerRole
  );
  const messages = useConversationMessages(managerId, workerId);
  const sendMessage = useSlangStore((s) => s.sendMessage);
  const sendImageMessage = useSlangStore((s) => s.sendImageMessage);
  const sendLocationMessage = useSlangStore((s) => s.sendLocationMessage);
  const commitProcessedMessage = useSlangStore((s) => s.commitProcessedMessage);
  const markManagerMessagesRead = useSlangStore((s) => s.markManagerMessagesRead);
  const markWorkerMessagesRead = useSlangStore((s) => s.markWorkerMessagesRead);
  const { showToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevTailIdRef = useRef<string | undefined>(undefined);
  const didInitialScrollRef = useRef(false);
  const loadOlderLockRef = useRef(false);
  const [voicePreview, setVoicePreview] = useState<VoiceTranscription | null>(null);
  const [isConfirmingVoice, setIsConfirmingVoice] = useState(false);

  useEffect(() => {
    didInitialScrollRef.current = false;
    prevTailIdRef.current = undefined;
  }, [managerId, workerId]);

  useEffect(() => {
    if (loading) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      });
      prevTailIdRef.current = messages[messages.length - 1]?.id;
      return;
    }
    if (loadingOlder) return;

    const tailId = messages[messages.length - 1]?.id;
    if (!tailId || tailId === prevTailIdRef.current) return;
    prevTailIdRef.current = tailId;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, loadingOlder, managerId, workerId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || loadingOlder || !hasMore || loadOlderLockRef.current) {
      return;
    }
    if (el.scrollTop > 80) return;

    loadOlderLockRef.current = true;
    const prevHeight = el.scrollHeight;

    void loadOlder().finally(() => {
      requestAnimationFrame(() => {
        const container = scrollRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight + container.scrollTop;
        }
        loadOlderLockRef.current = false;
      });
    });
  }, [loading, loadingOlder, hasMore, loadOlder]);

  const hasUnreadManagerMessages = messages.some(
    (m) => m.senderRole === "manager" && m.status === "sent"
  );
  const hasUnreadWorkerMessages = messages.some(
    (m) => m.senderRole === "worker" && m.status === "sent"
  );

  useEffect(() => {
    if (viewerRole !== "worker" || !hasUnreadManagerMessages || loading) return;
    markManagerMessagesRead(managerId, workerId);
  }, [viewerRole, managerId, workerId, hasUnreadManagerMessages, markManagerMessagesRead, loading]);

  useEffect(() => {
    if (viewerRole !== "manager" || !hasUnreadWorkerMessages || loading) return;
    markWorkerMessagesRead(managerId, workerId);
  }, [viewerRole, managerId, workerId, hasUnreadWorkerMessages, markWorkerMessagesRead, loading]);

  const getContext = () => buildTranslationContext(messages);

  const handleSend = async (text: string) => {
    try {
      await sendMessage(
        managerId,
        workerId,
        viewerRole,
        text,
        workerLanguage,
        getContext()
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : (sendFailedLabel ?? "שליחה נכשלה")
      );
    }
  };

  const handleImageSend = async (file: File) => {
    try {
      await sendImageMessage(managerId, workerId, viewerRole, file);
    } catch {
      showToast(imageSendFailedLabel);
    }
  };

  const handleLocationSend = async (location: {
    latitude: number;
    longitude: number;
    label?: string;
  }) => {
    await sendLocationMessage(managerId, workerId, viewerRole, location);
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
          workerId,
          originalLang: voicePreview.originalLang,
          lockSourceLang: viewerRole === "manager",
          context: getContext(),
          inputType: "voice",
        }
      );
      await commitProcessedMessage(
        managerId,
        workerId,
        viewerRole,
        result,
        workerLanguage,
        getContext()
      );
      setVoicePreview(null);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : (sendFailedLabel ?? "שליחה נכשלה")
      );
    } finally {
      setIsConfirmingVoice(false);
    }
  };

  const showQuickReplies =
    !loading &&
    viewerRole === "worker" &&
    messages.length === 0 &&
    quickReplies?.length;

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] px-6">
          <ChatLoadingState />
        </div>
        <Composer
          onSend={handleSend}
          onVoiceSend={handleVoiceRecorded}
          onImageSend={handleImageSend}
          onLocationSend={handleLocationSend}
          placeholder={composerPlaceholder}
          processingLabel={processingLabel}
          analyzingLabel={analyzingLabel}
          recordingLabel={recordingLabel}
          readyLabel={recordingReadyLabel}
          finishRecordingLabel={finishRecordingLabel}
          deleteRecordingLabel={deleteRecordingLabel}
          maxDurationLabel={maxDurationLabel}
          micErrorLabel={micErrorLabel}
          tooShortLabel={recordingTooShortLabel}
          attachImageTitle={attachImageTitle}
          takePhotoLabel={takePhotoLabel}
          chooseGalleryLabel={chooseGalleryLabel}
          shareLocationLabel={shareLocationLabel}
          imageSendFailedLabel={imageSendFailedLabel}
          locationSendFailedLabel={locationSendFailedLabel}
          locationInstructionsLabels={locationInstructionsLabels}
          large={largeComposer}
          dir={dir}
          disabled
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {loadingOlder && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center bg-gradient-to-b from-[var(--jobchat-surface)] from-70% to-transparent px-6 pb-6 pt-5"
          aria-live="polite"
          aria-busy="true"
        >
          <ChatLoadingState />
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-4"
      >
        {hasMore && !loadingOlder && (
          <div className="mb-3 flex justify-center py-1">
            <span className="text-xs text-gray-400">גלול למעלה לשיחות קודמות</span>
          </div>
        )}
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
                locationLabel={locationBubbleLabel}
              />
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {showQuickReplies && (
        <QuickReplies
          replies={quickReplies!}
          onSelect={(text) => void handleSend(text)}
        />
      )}

      <Composer
        onSend={handleSend}
        onVoiceSend={handleVoiceRecorded}
        onImageSend={handleImageSend}
        onLocationSend={handleLocationSend}
        placeholder={composerPlaceholder}
        processingLabel={processingLabel}
        analyzingLabel={analyzingLabel}
        recordingLabel={recordingLabel}
        readyLabel={recordingReadyLabel}
        finishRecordingLabel={finishRecordingLabel}
        deleteRecordingLabel={deleteRecordingLabel}
        maxDurationLabel={maxDurationLabel}
        micErrorLabel={micErrorLabel}
        tooShortLabel={recordingTooShortLabel}
        attachImageTitle={attachImageTitle}
        takePhotoLabel={takePhotoLabel}
        chooseGalleryLabel={chooseGalleryLabel}
        shareLocationLabel={shareLocationLabel}
        imageSendFailedLabel={imageSendFailedLabel}
        locationSendFailedLabel={locationSendFailedLabel}
        locationInstructionsLabels={locationInstructionsLabels}
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
        cancelLabel={voiceConfirmCancel}
        isSending={isConfirmingVoice}
        onSend={handleVoiceConfirm}
        onRerecord={() => setVoicePreview(null)}
        dir={dir}
      />
    </div>
  );
}
