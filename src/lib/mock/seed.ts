import type { Invite, Message, Worker } from "@/types";

export const DEFAULT_MANAGER_NAME = "דוד כהן";
export const DEFAULT_COMPANY_NAME = "כהן בנייה";

export const DEMO_WORKER_ID = "demo-worker-1";
export const DEMO_INVITE_TOKEN = "demo1234";

export function createSeedData(): {
  workers: Worker[];
  messages: Message[];
  invites: Invite[];
} {
  const workers: Worker[] = [
    {
      id: DEMO_WORKER_ID,
      name: "סומצ'אי",
      phone: "0521234567",
      language: "th",
      status: "active",
      inviteToken: DEMO_INVITE_TOKEN,
    },
  ];

  const invites: Invite[] = [
    {
      token: DEMO_INVITE_TOKEN,
      workerId: DEMO_WORKER_ID,
      managerName: DEFAULT_MANAGER_NAME,
      companyName: DEFAULT_COMPANY_NAME,
    },
  ];

  const messages: Message[] = [
    {
      id: "msg-1",
      workerId: DEMO_WORKER_ID,
      senderRole: "manager",
      originalText: "שלום, מה שלומך היום?",
      originalLang: "he",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: "delivered",
    },
    {
      id: "msg-2",
      workerId: DEMO_WORKER_ID,
      senderRole: "worker",
      originalText: "สวัสดี ทุกอย่างเรียบร้อย",
      originalLang: "th",
      createdAt: new Date(Date.now() - 3000000).toISOString(),
      status: "delivered",
    },
  ];

  return { workers, messages, invites };
}
