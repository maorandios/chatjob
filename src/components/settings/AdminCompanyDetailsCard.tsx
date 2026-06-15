"use client";

import { CompanyDetailsEditSheet } from "@/components/settings/CompanyDetailsEditSheet";
import { useToast } from "@/components/ui/Toast";
import { useSlangStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useState } from "react";

function DetailRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-gray-500">{label}</span>
      <span
        className={cn(
          "min-w-0 text-end text-sm",
          muted ? "text-gray-400" : "font-medium text-gray-900"
        )}
        dir="auto"
      >
        {value}
      </span>
    </div>
  );
}

export function AdminCompanyDetailsCard() {
  const companyName = useSlangStore((s) => s.companyName);
  const companyNumber = useSlangStore((s) => s.companyNumber);
  const updateCompanyDetails = useSlangStore((s) => s.updateCompanyDetails);
  const { showToast } = useToast();

  const [showEditSheet, setShowEditSheet] = useState(false);

  const registrationDisplay = companyNumber.trim() || "לא הוזן";

  return (
    <>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">פרטי חברה</p>
          <button
            type="button"
            onClick={() => setShowEditSheet(true)}
            className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-600 active:scale-95 active:opacity-70"
            aria-label="עריכת פרטי חברה"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-5">
          <DetailRow label="שם החברה" value={companyName} />
          <DetailRow
            label="ח.פ"
            value={registrationDisplay}
            muted={!companyNumber.trim()}
          />
        </div>
      </section>

      <CompanyDetailsEditSheet
        open={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        name={companyName}
        companyNumber={companyNumber}
        onSave={async (details) => {
          try {
            await updateCompanyDetails(details);
          } catch {
            showToast("לא ניתן לעדכן את פרטי החברה");
          }
        }}
      />
    </>
  );
}
