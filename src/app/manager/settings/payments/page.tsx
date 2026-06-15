"use client";

import { PaymentsScreenView } from "@/components/settings/PaymentsScreenView";
import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { AppShell } from "@/components/ui/AppShell";
import { useSlangStore } from "@/lib/store";
import { notFound } from "next/navigation";

export default function ManagerPaymentsPage() {
  const ready = useSlangStore((s) => s.ready);

  const isAdmin = useSlangStore((s) => s.isAdmin);

  if (!ready) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </AppShell>
    );
  }

  if (!useSlangStore.getState().managerId || !isAdmin) notFound();

  return (
    <AppShell dir="rtl">
      <SettingsScreenHeader title="תשלומים" backHref="/manager/settings" dir="rtl" />
      <PaymentsScreenView />
    </AppShell>
  );
}
