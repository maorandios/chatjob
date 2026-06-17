"use client";

import { AppShell } from "@/components/ui/AppShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { WorkerProfileSheet } from "@/components/chat/WorkerProfileSheet";
import { useRequireOnboardingComplete } from "@/lib/hooks/use-manager-access";
import {
  useContactDisplayName,
  useContactDisplayPhone,
  useSlangStore,
  useWorkerById,
} from "@/lib/store";
import { isWorkerInvitePending } from "@/lib/workers/invite-status";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManagerChatPage() {
  useRequireOnboardingComplete();
  const params = useParams<{ workerId: string }>();
  const router = useRouter();
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

  useEffect(() => {
    if (worker && isWorkerInvitePending(worker)) {
      router.replace("/manager");
    }
  }, [worker, router]);

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

  if (isWorkerInvitePending(worker)) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell dir="rtl">
      <ChatHeader
        name={displayName}
        subtitle={displayPhone}
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

      <WorkerProfileSheet
        open={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        displayName={displayName}
        displayPhone={displayPhone}
        copyPhone={worker.phone}
        employeeNumber={worker.employeeNumber}
        address={worker.address}
        onSave={(profile) => updateWorkerProfile(workerId, profile)}
        phoneCopiedLabel="מספר טלפון הועתק"
        dir="rtl"
      />
    </AppShell>
  );
}
