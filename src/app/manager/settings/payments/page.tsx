"use client";

import { PaymentsScreenView } from "@/components/settings/PaymentsScreenView";
import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { AppShell } from "@/components/ui/AppShell";
import { useRequireOnboardingComplete } from "@/lib/hooks/use-manager-access";
import { useSlangStore } from "@/lib/store";
import { notFound } from "next/navigation";

export default function ManagerPaymentsPage() {
  useRequireOnboardingComplete();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const isAdmin = useSlangStore((s) => s.isAdmin);

  if (!ready || !managerId) {
    return (
      <AppShell dir="rtl">
        <AppLoadingState />
      </AppShell>
    );
  }

  if (!isAdmin) notFound();

  return (
    <AppShell dir="rtl">
      <SettingsScreenHeader title="תשלומים" backHref="/manager/settings" dir="rtl" />
      <PaymentsScreenView />
    </AppShell>
  );
}
