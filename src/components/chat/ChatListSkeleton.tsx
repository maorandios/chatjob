"use client";

import { MainLoader } from "@/components/ui/MainLoader";

type ChatListSkeletonProps = {
  rows?: number;
};

export function ChatListSkeleton({ rows = 6 }: ChatListSkeletonProps) {
  void rows;

  return (
    <div
      className="flex min-h-48 items-center justify-center px-3 py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <MainLoader />
    </div>
  );
}
