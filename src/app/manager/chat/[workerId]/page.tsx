"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { useWorkerById } from "@/lib/mock/store";
import { notFound } from "next/navigation";
import { use } from "react";

type PageProps = {
  params: Promise<{ workerId: string }>;
};

export default function ManagerChatPage({ params }: PageProps) {
  const { workerId } = use(params);
  const worker = useWorkerById(workerId);

  if (!worker) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <ChatHeader
        name={worker.name}
        subtitle={worker.status === "pending" ? "ממתין להצטרפות" : "פעיל"}
        backHref="/manager"
        dir="rtl"
        showOnline={worker.status === "active"}
      />
      <ChatThread
        workerId={workerId}
        viewerRole="manager"
        workerLanguage={worker.language}
        translationCaption="תורגם אוטומטית"
        composerPlaceholder="הודעה"
        processingLabel="שולח..."
        recordingLabel="מקליט... שחרר לשליחה"
        micErrorLabel="לא ניתן לגשת למיקרופון"
        sendFailedLabel="שליחה נכשלה"
        recordingTooShortLabel="הקלטה קצרה מדי — החזק עוד קצת"
        voiceConfirmEditHint="ניתן לערוך אם משהו לא מדויק"
        dir="rtl"
      />
    </div>
  );
}
