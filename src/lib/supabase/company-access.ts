import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
  const [managerCompanyId, workerCompanyId] = await Promise.all([
    getManagerCompanyId(managerId),
    getWorkerCompanyId(workerId),
  ]);

  if (!managerCompanyId || !workerCompanyId || managerCompanyId !== workerCompanyId) {
    return null;
  }

  return managerCompanyId;
}
