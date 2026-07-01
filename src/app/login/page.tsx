"use client";

import { SessionRestore } from "@/components/auth/SessionRestore";
import { UnifiedLoginView } from "@/components/auth/UnifiedLoginView";

export default function LoginPage() {
  return (
    <SessionRestore>
      <UnifiedLoginView />
    </SessionRestore>
  );
}
