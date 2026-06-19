"use client";

type ChatListSkeletonProps = {
  rows?: number;
};

export function ChatListSkeleton({ rows = 6 }: ChatListSkeletonProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-3.5"
        >
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/70" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded-full bg-white/70" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/60" />
          </div>
          <div className="h-3 w-10 shrink-0 animate-pulse rounded-full bg-white/60" />
        </div>
      ))}
    </div>
  );
}
