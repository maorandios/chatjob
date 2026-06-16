"use client";

import { AdminOnboardingView } from "@/components/manager/AdminOnboardingView";
import { AppShell } from "@/components/ui/AppShell";
import { useOnboardingPageGuard } from "@/lib/hooks/use-manager-access";
import { useSlangStore } from "@/lib/store";

export default function ManagerOnboardingPage() {
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);

  useOnboardingPageGuard();

  if (!ready || !managerId || onboardingComplete) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 items-center justify-center bg-[var(--jobchat-surface)]">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </AppShell>
    );
  }

  return <AdminOnboardingView />;
}
