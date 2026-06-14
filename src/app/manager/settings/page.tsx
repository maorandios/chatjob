"use client";

import { ManagerSettingsView } from "@/components/settings/ManagerSettingsView";
import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { AppShell } from "@/components/ui/AppShell";
import { useSlangStore } from "@/lib/store";
import { notFound } from "next/navigation";

export default function ManagerSettingsPage() {
  const ready = useSlangStore((s) => s.ready);

  if (!ready) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </AppShell>
    );
  }

  if (!useSlangStore.getState().managerId) notFound();

  return (
    <AppShell dir="rtl">
      <SettingsScreenHeader title="הגדרות" backHref="/manager" dir="rtl" />
      <ManagerSettingsView />
    </AppShell>
  );
}
