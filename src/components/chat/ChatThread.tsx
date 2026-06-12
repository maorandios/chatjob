"use client";

import { Composer } from "@/components/chat/Composer";
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
  translationCaption?: string;
  emptyHint?: string;
  quickReplies?: string[];
  composerPlaceholder?: string;
  processingLabel?: string;
  recordingLabel?: string;
  micErrorLabel?: string;
  sendFailedLabel?: string;
  voiceConfirmTitle?: string;
  voiceConfirmYouSaid?: string;
  voiceConfirmEditHint?: string;
  voiceConfirmSend?: string;
  voiceConfirmRerecord?: string;
  recordingTooShortLabel?: string;
  dir?: "ltr" | "rtl";
  largeComposer?: boolean;
};

export function ChatThread({
  workerId,
  viewerRole,
  workerLanguage,
  translationCaption,
  emptyHint,
  quickReplies,
  composerPlaceholder,
  processingLabel,
  recordingLabel,
  micErrorLabel,
  sendFailedLabel,
  voiceConfirmTitle = "אישור הודעה קולית",
  voiceConfirmYouSaid = "אמרת:",
  voiceConfirmEditHint = "ניתן לערוך אם משהו לא מדויק",
  voiceConfirmSend = "שלח",
  voiceConfirmRerecord = "הקלט שוב",
  recordingTooShortLabel = "הקלטה קצרה מדי — החזק עוד קצת",
  dir = "rtl",
  largeComposer = false,
}: ChatThreadProps) {
  const messages = useWorkerMessages(workerId);
  const sendMessage = useJobChatStore((s) => s.sendMessage);
  const commitProcessedMessage = useJobChatStore((s) => s.commitProcessedMessage);
  const { showToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [voicePreview, setVoicePreview] = useState<VoiceTranscription | null>(null);
  const [isConfirmingVoice, setIsConfirmingVoice] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <>
      <div
        className="flex-1 overflow-y-auto bg-[#ECE5DD] px-3 py-4"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {messages.length === 0 && emptyHint && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-gray-500">{emptyHint}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((message: Message) => {
            const isOwn = message.senderRole === viewerRole;
            const displayText = getMessageDisplayText(
              message,
              viewerRole,
              workerLanguage
            );
            const recipientLang =
              viewerRole === "manager" ? "he" : workerLanguage;
            const showCaption =
              !isOwn &&
              message.originalLang !== recipientLang &&
              message.status !== "sending";

            return (
              <MessageBubble
                key={message.id}
                message={message}
                displayText={displayText}
                isOwn={isOwn}
                translationCaption={showCaption ? translationCaption : undefined}
                showStatus={viewerRole === "manager"}
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
        placeholder={composerPlaceholder}
        processingLabel={processingLabel}
        recordingLabel={recordingLabel}
        micErrorLabel={micErrorLabel}
        tooShortLabel={recordingTooShortLabel}
        large={largeComposer}
        dir={dir}
        disabled={!!voicePreview || isConfirmingVoice}
      />

      <VoiceConfirmSheet
        open={!!voicePreview}
        transcript={voicePreview?.originalText ?? ""}
        title={voiceConfirmTitle}
        youSaidLabel={voiceConfirmYouSaid}
        editHintLabel={voiceConfirmEditHint}
        sendLabel={voiceConfirmSend}
        rerecordLabel={voiceConfirmRerecord}
        isSending={isConfirmingVoice}
        onSend={handleVoiceConfirm}
        onRerecord={() => setVoicePreview(null)}
        dir={dir}
      />
    </>
  );
}
