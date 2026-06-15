"use client";

import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { UsersScreenView } from "@/components/settings/UsersScreenView";
import { AppShell } from "@/components/ui/AppShell";
import { useSlangStore } from "@/lib/store";
import { notFound } from "next/navigation";

export default function ManagerUsersPage() {
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
      <SettingsScreenHeader title="משתמשים" backHref="/manager/settings" dir="rtl" />
      <UsersScreenView />
    </AppShell>
  );
}
