"use client";

import { WorkerLoginView } from "@/components/worker/WorkerLoginView";
import { MobileFrame } from "@/components/ui/MobileFrame";

export default function WorkerLoginPage() {
  return (
    <MobileFrame dir="rtl">
      <WorkerLoginView />
    </MobileFrame>
  );
}
