"use client";

import { AdminCompanyDetailsCard } from "@/components/settings/AdminCompanyDetailsCard";
import { AdminPersonalProfileCard } from "@/components/settings/AdminPersonalProfileCard";
import { LocationPermissionSettingsCard } from "@/components/settings/LocationPermissionSettingsCard";
import { LogoutNavCard } from "@/components/settings/LogoutNavCard";
import { PushNotificationSettingsCard } from "@/components/settings/PushNotificationSettingsCard";
import { UsersNavCard } from "@/components/settings/UsersNavCard";
import { useSlangStore } from "@/lib/store";

export function ManagerSettingsView() {
  const isAdmin = useSlangStore((s) => s.isAdmin);
  const managerId = useSlangStore((s) => s.managerId);

  return (
    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-5">
      <div className="space-y-5">
        <AdminPersonalProfileCard />

        {isAdmin && <AdminCompanyDetailsCard />}

        {isAdmin && <UsersNavCard />}

        {managerId && (
          <PushNotificationSettingsCard
            userRole="manager"
            userId={managerId}
            dir="rtl"
          />
        )}

        <LocationPermissionSettingsCard dir="rtl" />

        <LogoutNavCard />
      </div>
    </div>
  );
}
