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

type ContactPageOptions = {
  limit?: number;
  offset?: number;
  query?: string;
  activeOnly?: boolean;
};

type ContactPageResult<T> = {
  items: T[];
  hasMore: boolean;
  total: number;
};

function matchesSearch(value: string | null | undefined, query: string): boolean {
  return Boolean(value?.toLowerCase().includes(query));
}

export async function getAccessibleWorkersForCompany(
  companyId: string,
  options: ContactPageOptions = {}
): Promise<ContactPageResult<Worker>> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const query = options.query?.trim().toLowerCase() ?? "";
  const supabase = getSupabaseAdmin();
  let membershipQuery = supabase
    .from("worker_company_memberships")
    .select("*")
    .eq("company_id", companyId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (!query && !options.activeOnly) {
    membershipQuery = membershipQuery.range(offset, offset + limit);
  }

  const { data: memberships, error: membershipsError } = await membershipQuery;

  if (membershipsError) throw membershipsError;
  if (!memberships?.length) return { items: [], hasMore: false, total: 0 };

  const workerIds = memberships.map((membership) => membership.worker_id);
  const { data: workers, error: workersError } = await supabase
    .from("workers")
    .select("*")
    .in("id", workerIds);

  if (workersError) throw workersError;

  const workersById = new Map((workers ?? []).map((worker) => [worker.id, worker]));
  let items = memberships.flatMap((membership) => {
    const worker = workersById.get(membership.worker_id);
    return worker ? [rowToWorker(worker, membership)] : [];
  });

  if (options.activeOnly) {
    items = items.filter((worker) => worker.status === "active" && worker.email);
  }

  if (query) {
    const filtered = items.filter((worker) =>
      [
        worker.name,
        worker.phone,
        worker.email,
        worker.privateNote,
      ].some((value) => matchesSearch(value, query))
    );
    return {
      items: filtered.slice(offset, offset + limit),
      hasMore: filtered.length > offset + limit,
      total: filtered.length,
    };
  }

  if (options.activeOnly) {
    return {
      items: items.slice(offset, offset + limit),
      hasMore: items.length > offset + limit,
      total: items.length,
    };
  }

  return {
    items: items.slice(0, limit),
    hasMore: items.length > limit,
    total: offset + Math.min(items.length, limit) + (items.length > limit ? 1 : 0),
  };
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
  fallbackCompanyId?: string,
  options: ContactPageOptions = {}
): Promise<ContactPageResult<Manager>> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const query = options.query?.trim() ?? "";
  const companyIds = await getActiveCompanyIdsForWorker(workerId);
  if (fallbackCompanyId && !companyIds.includes(fallbackCompanyId)) {
    companyIds.push(fallbackCompanyId);
  }
  if (companyIds.length === 0) return { items: [], hasMore: false, total: 0 };

  const supabase = getSupabaseAdmin();
  let managerQuery = supabase
    .from("managers")
    .select("*")
    .in("company_id", companyIds)
    .not("email", "is", null)
    .eq("onboarding_complete", true)
    .order("created_at", { ascending: false });

  if (query) {
    managerQuery = managerQuery.or(
      `name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`
    );
  }

  const { data, error } = await managerQuery.range(offset, offset + limit);

  if (error) throw error;
  const items = (data ?? []).slice(0, limit).map(rowToManager);
  return {
    items,
    hasMore: (data ?? []).length > limit,
    total: offset + items.length + ((data ?? []).length > limit ? 1 : 0),
  };
}

export async function ensureWorkerCompanyMembership({
  workerId,
  companyId,
  createdByManagerId,
  inviteToken = generateInviteToken(),
  status = "pending",
  displayName,
  displayPhone,
  privateNote,
}: {
  workerId: string;
  companyId: string;
  createdByManagerId?: string;
  inviteToken?: string;
  status?: "pending" | "active";
  displayName?: string;
  displayPhone?: string;
  privateNote?: string;
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
        display_name: displayName?.trim() || existing.display_name,
        display_phone: displayPhone?.trim() || existing.display_phone,
        private_note:
          privateNote !== undefined ? privateNote.trim() || null : existing.private_note,
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
      display_name: displayName?.trim() || null,
      display_phone: displayPhone?.trim() || null,
      private_note: privateNote?.trim() || null,
      created_by_manager_id: createdByManagerId ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
