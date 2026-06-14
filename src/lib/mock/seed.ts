import type { Invite, Message, Worker } from "@/types";

export const DEFAULT_MANAGER_NAME = "דוד כהן";
export const DEFAULT_MANAGER_PHONE = "0509876543";
export const DEFAULT_COMPANY_NAME = "כהן בנייה";
export const DEFAULT_ADMIN_NAME = "מנהל ראשי";
export const DEFAULT_ADMIN_PHONE = "0501234567";

export const DEMO_COMPANY_ID = "demo-company-1";
export const DEMO_MANAGER_ID = "demo-manager-1";
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
      companyId: DEMO_COMPANY_ID,
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
      companyId: DEMO_COMPANY_ID,
      companyName: DEFAULT_COMPANY_NAME,
    },
  ];

  const messages: Message[] = [
    {
      id: "msg-1",
      companyId: DEMO_COMPANY_ID,
      managerId: DEMO_MANAGER_ID,
      workerId: DEMO_WORKER_ID,
      senderRole: "manager",
      originalText: "שלום, מה שלומך היום?",
      originalLang: "he",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: "delivered",
    },
    {
      id: "msg-2",
      companyId: DEMO_COMPANY_ID,
      managerId: DEMO_MANAGER_ID,
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
