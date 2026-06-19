"use client";

import { ManagerChatView } from "@/components/manager/ManagerChatView";
import { notFound, useParams } from "next/navigation";

export default function ManagerChatPage() {
  const params = useParams<{ workerId: string }>();
  const workerId = params?.workerId;

  if (!workerId) notFound();

  return <ManagerChatView workerId={workerId} />;
}
