"use client";

export function PaymentsScreenView() {
  return (
    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-5">
      <div className="rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-10 text-center">
        <p className="text-sm font-medium text-gray-900">חיוב חודשי</p>
        <p className="mt-2 text-sm text-gray-500">בקרוב</p>
      </div>
    </div>
  );
}
