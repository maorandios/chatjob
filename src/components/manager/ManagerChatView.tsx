"use client";

import { ChatLoadingState } from "@/components/chat/ChatLoadingState";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { ContactNameSheet } from "@/components/chat/ContactNameSheet";
import { AppShell } from "@/components/ui/AppShell";
import { useRequireOnboardingComplete } from "@/lib/hooks/use-manager-access";
import {
  useContactDisplayName,
  useContactDisplayPhone,
  useSlangStore,
  useWorkerById,
} from "@/lib/store";
import { isWorkerInvitePending } from "@/lib/workers/invite-status";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ManagerChatViewProps = {
  workerId: string;
};

export function ManagerChatView({ workerId }: ManagerChatViewProps) {
  useRequireOnboardingComplete();
  const router = useRouter();
  const managerId = useSlangStore((s) => s.managerId);
  const ready = useSlangStore((s) => s.ready);
  const worker = useWorkerById(workerId);
  const updateWorkerProfile = useSlangStore((s) => s.updateWorkerProfile);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const displayName = useContactDisplayName(
    "manager",
    workerId,
    worker?.name ?? ""
  );
  const displayPhone = useContactDisplayPhone(
    "manager",
    workerId,
    worker?.phone ?? ""
  );

  useEffect(() => {
    if (worker && isWorkerInvitePending(worker)) {
      router.replace("/manager");
    }
  }, [worker, router]);

  if (!ready || !managerId) {
    return (
      <AppShell dir="rtl">
        <div className="flex min-h-0 flex-1 items-center bg-[var(--jobchat-surface)]">
          <ChatLoadingState />
        </div>
      </AppShell>
    );
  }

  if (!workerId || !worker) notFound();

  if (isWorkerInvitePending(worker)) {
    return (
      <AppShell dir="rtl">
        <div className="flex min-h-0 flex-1 items-center bg-[var(--jobchat-surface)]">
          <ChatLoadingState />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell dir="rtl">
      <ChatHeader
        name={displayName}
        subtitle={displayPhone}
        imageUrl={worker.profileImageUrl}
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
        email={worker.email}
        imageUrl={worker.profileImageUrl}
        privateNote={worker.privateNote}
        onSave={(profile) =>
          updateWorkerProfile(workerId, {
            name: profile.name,
            phone: displayPhone,
            privateNote: profile.privateNote ?? "",
          })
        }
        namePlaceholder="שם איש קשר"
        phonePlaceholder="מספר טלפון"
        saveLabel="שמירה"
        phoneCopiedLabel="מספר טלפון הועתק"
        noteLabel="תיאור קצר"
        notePlaceholder="תיאור העובד"
        editablePhone={false}
        editableNote
        dir="rtl"
      />
    </AppShell>
  );
}
