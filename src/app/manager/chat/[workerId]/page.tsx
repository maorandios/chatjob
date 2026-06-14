"use client";

import { AppShell } from "@/components/ui/AppShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { ContactNameSheet } from "@/components/chat/ContactNameSheet";
import {
  useContactDisplayName,
  useContactDisplayPhone,
  useSlangStore,
  useWorkerById,
} from "@/lib/store";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";

export default function ManagerChatPage() {
  const params = useParams<{ workerId: string }>();
  const workerId = params?.workerId;
  const managerId = useSlangStore((s) => s.managerId);
  const ready = useSlangStore((s) => s.ready);
  const worker = useWorkerById(workerId ?? "");
  const updateWorkerProfile = useSlangStore((s) => s.updateWorkerProfile);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const displayName = useContactDisplayName(
    "manager",
    workerId ?? "",
    worker?.name ?? ""
  );
  const displayPhone = useContactDisplayPhone(
    "manager",
    workerId ?? "",
    worker?.phone ?? ""
  );

  if (!ready || !managerId) {
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
          worker.status === "pending" ? "ממתין להצטרפות" : displayPhone
        }
        backHref="/manager"
        dir="rtl"
        showOnline={false}
        onProfileClick={() => setShowContactSheet(true)}
      />
      <ChatThread
        managerId={managerId}
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
        originalPhone={worker.phone}
        displayName={displayName}
        displayPhone={displayPhone}
        onSave={(profile) => updateWorkerProfile(workerId, profile)}
        namePlaceholder="שם מלא"
        phonePlaceholder="מספר טלפון"
        saveLabel="שמור"
        phoneCopiedLabel="מספר טלפון הועתק"
        dir="rtl"
      />
    </AppShell>
  );
}
