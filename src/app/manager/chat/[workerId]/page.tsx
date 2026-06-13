"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { ContactNameSheet } from "@/components/chat/ContactNameSheet";
import {
  useContactDisplayName,
  useJobChatStore,
  useWorkerById,
} from "@/lib/mock/store";
import { notFound } from "next/navigation";
import { use, useState } from "react";

type PageProps = {
  params: Promise<{ workerId: string }>;
};

export default function ManagerChatPage({ params }: PageProps) {
  const { workerId } = use(params);
  const worker = useWorkerById(workerId);
  const setContactAlias = useJobChatStore((s) => s.setContactAlias);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const displayName = useContactDisplayName(
    "manager",
    workerId,
    worker?.name ?? ""
  );

  if (!worker) notFound();

  return (
    <div className="mobile-shell flex flex-col overflow-hidden">
      <ChatHeader
        name={displayName}
        subtitle={
          worker.status === "pending" ? "ממתין להצטרפות" : worker.phone
        }
        backHref="/manager"
        dir="rtl"
        showOnline={false}
        onProfileClick={() => setShowContactSheet(true)}
      />
      <ChatThread
        workerId={workerId}
        viewerRole="manager"
        workerLanguage={worker.language}
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

      <ContactNameSheet
        open={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        originalName={worker.name}
        displayName={displayName}
        onSave={(name) => setContactAlias("manager", workerId, name)}
        title="שם איש קשר"
        originalLabel="שם מקורי"
        placeholder="איך לקרוא לעובד?"
        saveLabel="שמור"
        dir="rtl"
      />
    </div>
  );
}
