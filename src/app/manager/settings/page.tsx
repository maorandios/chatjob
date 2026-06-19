"use client";

import { ManagerSettingsView } from "@/components/settings/ManagerSettingsView";
import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { AppShell } from "@/components/ui/AppShell";
import { useRequireOnboardingComplete } from "@/lib/hooks/use-manager-access";
import { useSlangStore } from "@/lib/store";

export default function ManagerSettingsPage() {
  useRequireOnboardingComplete();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);

  if (!ready || !managerId) {
    return (
      <AppShell dir="rtl">
        <AppLoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell dir="rtl">
      <SettingsScreenHeader title="פרופיל אישי" backHref="/manager" dir="rtl" />
      <ManagerSettingsView />
    </AppShell>
  );
}
