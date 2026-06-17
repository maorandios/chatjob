import { PageStackTransition } from "@/components/ui/PageStackTransition";
import { Suspense, type ReactNode } from "react";

function InviteStack({ children }: { children: ReactNode }) {
  return <PageStackTransition dir="ltr">{children}</PageStackTransition>;
}

export default function InviteTokenLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={children}>
      <InviteStack>{children}</InviteStack>
    </Suspense>
  );
}
