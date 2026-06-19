"use client";

import { ManagerChatView } from "@/components/manager/ManagerChatView";
import { AppShell } from "@/components/ui/AppShell";
import { useRequireOnboardingComplete } from "@/lib/hooks/use-manager-access";
import { useSlangStore, useWorkerByToken } from "@/lib/store";
import { notFound, useParams } from "next/navigation";

export default function CleanManagerChatPage() {
  useRequireOnboardingComplete();
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "";
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const worker = useWorkerByToken(code);

  if (!code) notFound();

  if (!ready || !managerId) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </AppShell>
    );
  }

  if (!worker) notFound();

  return <ManagerChatView workerId={worker.id} />;
}
