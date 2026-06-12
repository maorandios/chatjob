import { MobileFrame } from "@/components/ui/MobileFrame";
import type { ReactNode } from "react";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <MobileFrame dir="rtl" className="bg-white">
      {children}
    </MobileFrame>
  );
}
