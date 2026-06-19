"use client";

import { AdminOnboardingView } from "@/components/manager/AdminOnboardingView";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
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
        <AppLoadingState />
      </AppShell>
    );
  }

  return <AdminOnboardingView />;
}
