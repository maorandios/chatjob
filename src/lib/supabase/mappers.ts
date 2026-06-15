import type { Database } from "@/lib/supabase/database.types";
import type {
  Company,
  LanguageCode,
  Manager,
  Message,
  Worker,
  WorkerInvite,
} from "@/types";

type DbCompany = Database["public"]["Tables"]["companies"]["Row"];
type DbManager = Database["public"]["Tables"]["managers"]["Row"];
type DbWorker = Database["public"]["Tables"]["workers"]["Row"];
type DbMessage = Database["public"]["Tables"]["messages"]["Row"];

export function companyFromRow(row: DbCompany): Company {
  return {
    id: row.id,
    name: row.name,
    companyNumber: row.company_number ?? undefined,
  };
}

export function rowToManager(row: DbManager): Manager {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    inviteToken: row.invite_token,
    isAdmin: row.is_admin,
  };
}

export function rowToWorker(row: DbWorker): Worker {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    phone: row.phone,
    employeeNumber: row.employee_number ?? undefined,
    address: row.address ?? undefined,
    language: (row.language as LanguageCode | null) ?? undefined,
    status: row.status as Worker["status"],
    inviteToken: row.invite_token,
  };
}

export function rowToMessage(row: DbMessage): Message {
  return {
    id: row.id,
    companyId: row.company_id,
    managerId: row.manager_id,
    workerId: row.worker_id,
    senderRole: row.sender_role as Message["senderRole"],
    originalText: row.original_text,
    originalLang: row.original_lang,
    translatedText: row.translated_text ?? undefined,
    targetLang: row.target_lang ?? undefined,
    inputType: row.input_type as Message["inputType"],
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
    status: row.status as Message["status"],
  };
}

export function rowToWorkerInvite(row: DbWorker, company: DbCompany): WorkerInvite {
  return {
    token: row.invite_token,
    workerId: row.id,
    companyId: company.id,
    companyName: company.name,
  };
}

export function getManagerInviteUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/manager/join/${token}`;
  }
  return `/manager/join/${token}`;
}
