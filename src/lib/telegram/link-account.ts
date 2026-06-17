import { parseTelegramStartParam } from "@/lib/telegram/config";
import type { ParsedTelegramInitData } from "@/lib/telegram/verify-init-data";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  companyFromRow,
  rowToManager,
  rowToWorker,
} from "@/lib/supabase/mappers";

const TELEGRAM_ALREADY_LINKED_MESSAGE =
  "חשבון טלגרם זה כבר מקושר למשתמש אחר";

async function assertTelegramUserAvailable(
  table: "managers" | "workers",
  telegramUserId: number,
  currentId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (error) throw error;
  if (data && data.id !== currentId) {
    throw new Error(TELEGRAM_ALREADY_LINKED_MESSAGE);
  }
}

async function linkManagerTelegramUser(
  managerId: string,
  telegramUserId: number
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await assertTelegramUserAvailable("managers", telegramUserId, managerId);

  const { error } = await supabase
    .from("managers")
    .update({ telegram_user_id: telegramUserId })
    .eq("id", managerId);

  if (error) {
    if (error.code === "23505") {
      throw new Error(TELEGRAM_ALREADY_LINKED_MESSAGE);
    }
    throw error;
  }
}

async function linkWorkerTelegramUser(
  workerId: string,
  telegramUserId: number
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await assertTelegramUserAvailable("workers", telegramUserId, workerId);

  const { error } = await supabase
    .from("workers")
    .update({ telegram_user_id: telegramUserId })
    .eq("id", workerId);

  if (error) {
    if (error.code === "23505") {
      throw new Error(TELEGRAM_ALREADY_LINKED_MESSAGE);
    }
    throw error;
  }
}

async function loadManagerBundleById(managerId: string) {
  const supabase = getSupabaseAdmin();

  const { data: manager, error } = await supabase
    .from("managers")
    .select("*")
    .eq("id", managerId)
    .maybeSingle();

  if (error) throw error;
  if (!manager) return null;

  const [{ data: company, error: companyError }, { data: managers, error: managersError }, { data: workers, error: workersError }] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", manager.company_id).single(),
      supabase
        .from("managers")
        .select("*")
        .eq("company_id", manager.company_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("workers")
        .select("*")
        .eq("company_id", manager.company_id)
        .order("created_at", { ascending: false }),
    ]);

  if (companyError) throw companyError;
  if (managersError) throw managersError;
  if (workersError) throw workersError;

  return {
    manager: rowToManager(manager),
    company: companyFromRow(company),
    managers: (managers ?? []).map(rowToManager),
    workers: (workers ?? []).map(rowToWorker),
  };
}

export type TelegramSessionResult =
  | {
      role: "manager";
      managerId: string;
      inviteToken: string;
      bundle: NonNullable<Awaited<ReturnType<typeof loadManagerBundleById>>>;
    }
  | {
      role: "worker";
      workerId: string;
      inviteToken: string;
      worker: ReturnType<typeof rowToWorker>;
    }
  | {
      role: "unknown";
      message: string;
    };

export async function resolveTelegramSession(
  parsed: ParsedTelegramInitData
): Promise<TelegramSessionResult> {
  const supabase = getSupabaseAdmin();
  const telegramUserId = parsed.user.id;
  const start = parseTelegramStartParam(parsed.startParam);

  if (start?.kind === "manager") {
    const { data: manager, error } = await supabase
      .from("managers")
      .select("*")
      .eq("invite_token", start.token)
      .maybeSingle();

    if (error) throw error;
    if (!manager) {
      return { role: "unknown", message: "קישור מנהל לא תקין" };
    }

    await linkManagerTelegramUser(manager.id, telegramUserId);
    const bundle = await loadManagerBundleById(manager.id);
    if (!bundle) {
      return { role: "unknown", message: "לא נמצא מנהל" };
    }

    return {
      role: "manager",
      managerId: manager.id,
      inviteToken: manager.invite_token,
      bundle,
    };
  }

  if (start?.kind === "worker") {
    const { data: worker, error } = await supabase
      .from("workers")
      .select("*")
      .eq("invite_token", start.token)
      .maybeSingle();

    if (error) throw error;
    if (!worker) {
      return { role: "unknown", message: "קישור עובד לא תקין" };
    }

    await linkWorkerTelegramUser(worker.id, telegramUserId);

    const { data: refreshed, error: refreshError } = await supabase
      .from("workers")
      .select("*")
      .eq("id", worker.id)
      .single();

    if (refreshError) throw refreshError;

    return {
      role: "worker",
      workerId: worker.id,
      inviteToken: worker.invite_token,
      worker: rowToWorker(refreshed),
    };
  }

  const [{ data: managerByTelegram, error: managerError }, { data: workerByTelegram, error: workerError }] =
    await Promise.all([
      supabase
        .from("managers")
        .select("id, invite_token")
        .eq("telegram_user_id", telegramUserId)
        .maybeSingle(),
      supabase
        .from("workers")
        .select("*")
        .eq("telegram_user_id", telegramUserId)
        .maybeSingle(),
    ]);

  if (managerError) throw managerError;
  if (workerError) throw workerError;

  if (managerByTelegram) {
    const bundle = await loadManagerBundleById(managerByTelegram.id);
    if (!bundle) {
      return { role: "unknown", message: "לא נמצא מנהל" };
    }

    return {
      role: "manager",
      managerId: managerByTelegram.id,
      inviteToken: managerByTelegram.invite_token,
      bundle,
    };
  }

  if (workerByTelegram) {
    return {
      role: "worker",
      workerId: workerByTelegram.id,
      inviteToken: workerByTelegram.invite_token,
      worker: rowToWorker(workerByTelegram),
    };
  }

  return {
    role: "unknown",
    message:
      "פתחו את הקישור שקיבלתם מהמנהל או השתמשו בתפריט Open Kling לאחר הצטרפות.",
  };
}
