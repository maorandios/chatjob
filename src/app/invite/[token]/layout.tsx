import { PageStackTransition } from "@/components/ui/PageStackTransition";
import { TelegramWebRedirect } from "@/components/telegram/TelegramWebRedirect";
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
      <TelegramWebRedirect />
      <InviteStack>{children}</InviteStack>
    </Suspense>
  );
}
