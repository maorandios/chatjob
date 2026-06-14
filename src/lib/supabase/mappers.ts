import type { Database } from "@/lib/supabase/database.types";
import type { Invite, LanguageCode, Message, Worker } from "@/types";

type DbManager = Database["public"]["Tables"]["managers"]["Row"];
type DbWorker = Database["public"]["Tables"]["workers"]["Row"];
type DbMessage = Database["public"]["Tables"]["messages"]["Row"];

export function rowToWorker(row: DbWorker): Worker {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    language: (row.language as LanguageCode | null) ?? undefined,
    status: row.status as Worker["status"],
    inviteToken: row.invite_token,
  };
}

export function rowToMessage(row: DbMessage): Message {
  return {
    id: row.id,
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

export function rowToInvite(row: DbWorker, manager: DbManager): Invite {
  return {
    token: row.invite_token,
    workerId: row.id,
    managerName: manager.name,
    managerPhone: manager.phone,
    companyName: manager.company_name,
  };
}

export function managerFromRow(row: DbManager) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    companyName: row.company_name,
  };
}
