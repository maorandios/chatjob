"use client";

import { AdminCompanyDetailsCard } from "@/components/settings/AdminCompanyDetailsCard";
import { AdminPersonalProfileCard } from "@/components/settings/AdminPersonalProfileCard";
import { LogoutNavCard } from "@/components/settings/LogoutNavCard";
import { PaymentsNavCard } from "@/components/settings/PaymentsNavCard";
import { UsersNavCard } from "@/components/settings/UsersNavCard";
import { useSlangStore } from "@/lib/store";

export function ManagerSettingsView() {
  const isAdmin = useSlangStore((s) => s.isAdmin);

  return (
    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-5">
      <div className="space-y-5">
        <AdminPersonalProfileCard />

        {isAdmin && <AdminCompanyDetailsCard />}

        {isAdmin && <UsersNavCard />}

        {isAdmin && <PaymentsNavCard />}

        <LogoutNavCard />

        <p className="pb-4 text-center text-xs text-gray-400">Slang</p>
      </div>
    </div>
  );
}
