import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToManager, rowToWorker } from "@/lib/supabase/mappers";
import { generateInviteToken } from "@/lib/supabase/tokens";
import type { Database } from "@/lib/supabase/database.types";
import type { Manager, Worker } from "@/types";

export type WorkerMembershipRow =
  Database["public"]["Tables"]["worker_company_memberships"]["Row"];

export async function getWorkerMembershipByInviteToken(
  inviteToken: string
): Promise<WorkerMembershipRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("worker_company_memberships")
    .select("*")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getAccessibleWorkersForCompany(
  companyId: string
): Promise<Worker[]> {
  const supabase = getSupabaseAdmin();
  const { data: memberships, error: membershipsError } = await supabase
    .from("worker_company_memberships")
    .select("*")
    .eq("company_id", companyId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (membershipsError) throw membershipsError;
  if (!memberships?.length) return [];

  const workerIds = memberships.map((membership) => membership.worker_id);
  const { data: workers, error: workersError } = await supabase
    .from("workers")
    .select("*")
    .in("id", workerIds);

  if (workersError) throw workersError;

  const workersById = new Map((workers ?? []).map((worker) => [worker.id, worker]));
  return memberships.flatMap((membership) => {
    const worker = workersById.get(membership.worker_id);
    return worker ? [rowToWorker(worker, membership)] : [];
  });
}

export async function getActiveCompanyIdsForWorker(
  workerId: string
): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("worker_company_memberships")
    .select("company_id")
    .eq("worker_id", workerId)
    .eq("status", "active");

  if (error) throw error;
  return (data ?? []).map((membership) => membership.company_id);
}

export async function getManagersForWorkerMemberships(
  workerId: string,
  fallbackCompanyId?: string
): Promise<Manager[]> {
  const companyIds = await getActiveCompanyIdsForWorker(workerId);
  if (fallbackCompanyId && !companyIds.includes(fallbackCompanyId)) {
    companyIds.push(fallbackCompanyId);
  }
  if (companyIds.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("managers")
    .select("*")
    .in("company_id", companyIds)
    .not("email", "is", null)
    .eq("onboarding_complete", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToManager);
}

export async function ensureWorkerCompanyMembership({
  workerId,
  companyId,
  createdByManagerId,
  inviteToken = generateInviteToken(),
  status = "pending",
}: {
  workerId: string;
  companyId: string;
  createdByManagerId?: string;
  inviteToken?: string;
  status?: "pending" | "active";
}): Promise<WorkerMembershipRow> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("worker_company_memberships")
    .select("*")
    .eq("worker_id", workerId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    if (existing.status === "active") return existing;

    const { data, error } = await supabase
      .from("worker_company_memberships")
      .update({
        invite_token: inviteToken,
        status,
        created_by_manager_id: createdByManagerId ?? existing.created_by_manager_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("worker_company_memberships")
    .insert({
      worker_id: workerId,
      company_id: companyId,
      invite_token: inviteToken,
      status,
      relationship_type: "direct",
      created_by_manager_id: createdByManagerId ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
