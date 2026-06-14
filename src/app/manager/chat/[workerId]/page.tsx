"use client";

import { AppShell } from "@/components/ui/AppShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { ContactNameSheet } from "@/components/chat/ContactNameSheet";
import { useChatData } from "@/lib/hooks/use-slang-data";
import {
  useContactDisplayName,
  useSlangStore,
  useWorkerById,
} from "@/lib/store";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";

export default function ManagerChatPage() {
  const params = useParams<{ workerId: string }>();
  const workerId = params?.workerId;
  const ready = useSlangStore((s) => s.ready);
  const worker = useWorkerById(workerId ?? "");
  const setContactAlias = useSlangStore((s) => s.setContactAlias);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const displayName = useContactDisplayName(
    "manager",
    workerId ?? "",
    worker?.name ?? ""
  );

  useChatData(workerId);

  if (!ready) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </AppShell>
    );
  }

  if (!workerId || !worker) notFound();

  return (
    <AppShell dir="rtl">
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
    </AppShell>
  );
}
