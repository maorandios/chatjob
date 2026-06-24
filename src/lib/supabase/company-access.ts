import { normalizeEmail } from "@/lib/auth/email";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { LanguageCode } from "@/types";

export async function getManagerCompanyId(managerId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("managers")
    .select("company_id")
    .eq("id", managerId)
    .maybeSingle();

  if (error) throw error;
  return data?.company_id ?? null;
}

export async function assertManagerIsAdmin(
  managerId: string
): Promise<{ companyId: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("managers")
    .select("company_id, is_admin")
    .eq("id", managerId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.is_admin) return null;
  return { companyId: data.company_id };
}

export async function getWorkerCompanyId(workerId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data: membership, error: membershipError } = await supabase
    .from("worker_company_memberships")
    .select("company_id")
    .eq("worker_id", workerId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (membership?.company_id) return membership.company_id;

  const { data, error } = await supabase
    .from("workers")
    .select("company_id")
    .eq("id", workerId)
    .maybeSingle();

  if (error) throw error;
  return data?.company_id ?? null;
}

export async function assertSameCompanyParticipants(
  managerId: string,
  workerId: string
): Promise<string | null> {
  const managerCompanyId = await getManagerCompanyId(managerId);
  if (!managerCompanyId) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("worker_company_memberships")
    .select("id")
    .eq("worker_id", workerId)
    .eq("company_id", managerCompanyId)
    .neq("status", "revoked")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return managerCompanyId;
}

export async function assertActiveConversationParticipants(
  managerId: string,
  workerId: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const [{ data: manager, error: managerError }, { data: worker, error: workerError }] =
    await Promise.all([
      supabase
        .from("managers")
        .select("company_id, email, onboarding_complete")
        .eq("id", managerId)
        .maybeSingle(),
      supabase
        .from("workers")
        .select("email, status")
        .eq("id", workerId)
        .maybeSingle(),
    ]);

  if (managerError) throw managerError;
  if (workerError) throw workerError;

  if (!manager || !worker) {
    return null;
  }
  if (!manager.email || !manager.onboarding_complete) {
    return null;
  }
  if (!worker.email || worker.status !== "active") {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("worker_company_memberships")
    .select("id")
    .eq("worker_id", workerId)
    .eq("company_id", manager.company_id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  return manager.company_id;
}

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization") ?? "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

export async function assertAuthenticatedWorkerRequest(
  req: Request,
  workerId: string
): Promise<boolean> {
  const accessToken = getBearerToken(req);
  if (!accessToken) return false;

  const supabase = getSupabaseAdmin();
  const [{ data: worker, error: workerError }, { data: authData, error: authError }] =
    await Promise.all([
      supabase
        .from("workers")
        .select("email, status")
        .eq("id", workerId)
        .maybeSingle(),
      supabase.auth.getUser(accessToken),
    ]);

  if (workerError) throw workerError;
  if (authError || !worker?.email || worker.status !== "active") return false;

  const authenticatedEmail = authData.user?.email
    ? normalizeEmail(authData.user.email)
    : "";
  return authenticatedEmail === normalizeEmail(worker.email);
}

/** Prefer worker language from DB — manager clients often have a stale copy. */
export async function resolveWorkerLanguageForTranslation(
  workerId: string,
  clientHint?: LanguageCode
): Promise<LanguageCode | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("workers")
    .select("language")
    .eq("id", workerId)
    .maybeSingle();

  if (error) throw error;

  if (data?.language) {
    return normalizeWorkerLanguage(data.language);
  }

  if (clientHint) {
    return normalizeWorkerLanguage(clientHint);
  }

  return undefined;
}
