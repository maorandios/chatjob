import { normalizeEmail } from "@/lib/auth/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateInviteToken } from "@/lib/supabase/tokens";

type ManagerEmailRow = {
  id: string;
  email: string | null;
  is_admin: boolean;
};

const NEW_SIGNUP_COMPANY_NAME = "חברה חדשה";
const NEW_SIGNUP_PHONE_PLACEHOLDER = "0500000000";

async function loadManagersWithEmail(): Promise<ManagerEmailRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("managers")
    .select("id, email, is_admin");

  if (error) throw error;
  return data ?? [];
}

export async function findManagerIdByEmail(
  email: string
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const managers = await loadManagersWithEmail();

  const manager = managers.find(
    (row) => row.email && normalizeEmail(row.email) === normalized
  );

  return manager?.id ?? null;
}

function defaultAdminNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local || "מנהל ראשי";
}

/** Creates a new company and admin manager for a first-time email signup. */
export async function signupAdminWithEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const existing = await findManagerIdByEmail(normalized);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  const inviteToken = generateInviteToken();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: NEW_SIGNUP_COMPANY_NAME })
    .select("id")
    .single();

  if (companyError) throw companyError;

  const { data: manager, error: managerError } = await supabase
    .from("managers")
    .insert({
      company_id: company.id,
      name: defaultAdminNameFromEmail(normalized),
      phone: NEW_SIGNUP_PHONE_PLACEHOLDER,
      email: normalized,
      invite_token: inviteToken,
      is_admin: true,
    })
    .select("id")
    .single();

  if (managerError) {
    if (managerError.code === "23505") {
      const raced = await findManagerIdByEmail(normalized);
      if (raced) return raced;
    }
    throw managerError;
  }

  return manager.id;
}

/** Login to an existing manager, or sign up a new admin + company for new emails. */
export async function resolveManagerIdForLogin(
  email: string
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const existing = await findManagerIdByEmail(normalized);
  if (existing) return existing;

  return signupAdminWithEmail(normalized);
}
