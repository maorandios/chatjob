import { normalizeEmail } from "@/lib/auth/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateInviteToken } from "@/lib/supabase/tokens";

const NEW_SIGNUP_COMPANY_NAME = "חברה חדשה";
const NEW_SIGNUP_PHONE_PLACEHOLDER = "0500000000";

export async function findManagerIdByEmail(
  email: string
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("managers")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

function defaultAdminNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local || "מנהל ראשי";
}

function isMissingColumnError(
  error: { message?: string; code?: string },
  column: string
): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    msg.includes(column.toLowerCase()) &&
    (msg.includes("column") ||
      msg.includes("schema cache") ||
      error.code === "PGRST204")
  );
}

async function insertSignupManager(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  payload: {
    company_id: string;
    name: string;
    phone: string;
    email: string;
    invite_token: string;
  }
): Promise<string> {
  const withOnboarding = {
    ...payload,
    is_admin: true,
    onboarding_complete: false,
  };

  let { data: manager, error: managerError } = await supabase
    .from("managers")
    .insert(withOnboarding)
    .select("id")
    .single();

  if (
    managerError &&
    isMissingColumnError(managerError, "onboarding_complete")
  ) {
    ({ data: manager, error: managerError } = await supabase
      .from("managers")
      .insert({ ...payload, is_admin: true })
      .select("id")
      .single());
  }

  if (managerError) {
    if (managerError.code === "23505") {
      const raced = await findManagerIdByEmail(payload.email);
      if (raced) return raced;
    }
    throw managerError;
  }

  if (!manager?.id) {
    throw new Error("Failed to create manager row");
  }

  return manager.id;
}

/** Creates a new company and admin manager for a first-time email signup. */
export async function signupAdminWithEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const existing = await findManagerIdByEmail(normalized);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  const inviteToken = generateInviteToken();

  let { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: NEW_SIGNUP_COMPANY_NAME, email: normalized })
    .select("id")
    .single();

  if (companyError && isMissingColumnError(companyError, "email")) {
    ({ data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ name: NEW_SIGNUP_COMPANY_NAME })
      .select("id")
      .single());
  }

  if (companyError) {
    if (
      companyError.message?.toLowerCase().includes("relation") &&
      companyError.message?.toLowerCase().includes("companies")
    ) {
      throw new Error(
        "טבלאות מסד הנתונים חסרות. הריצו את supabase/schema.sql ב-Supabase SQL Editor."
      );
    }
    throw companyError;
  }

  return insertSignupManager(supabase, {
    company_id: company.id,
    name: defaultAdminNameFromEmail(normalized),
    phone: NEW_SIGNUP_PHONE_PLACEHOLDER,
    email: normalized,
    invite_token: inviteToken,
  });
}

/** Login to an existing manager, or sign up a new admin + company for new emails. */
export async function resolveManagerIdForLogin(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const existing = await findManagerIdByEmail(normalized);
  if (existing) return existing;

  return signupAdminWithEmail(normalized);
}

function mapResolveManagerError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "לא ניתן ליצור חשבון. נסו שוב.";
  }

  const msg = error.message.toLowerCase();

  if (msg.includes("missing next_public_supabase_url") || msg.includes("service_role")) {
    return "השרת לא מוגדר (חסר מפתח Supabase).";
  }
  if (msg.includes("relation") && msg.includes("does not exist")) {
    return "מסד הנתונים לא מוגדר. הריצו את supabase/schema.sql ב-Supabase.";
  }
  if (msg.includes("טבלאות מסד הנתונים")) {
    return error.message;
  }
  if (msg.includes("duplicate") || msg.includes("unique")) {
    return "כתובת המייל כבר רשומה במערכת.";
  }

  return "לא ניתן ליצור חשבון. ודאו שמסד הנתונים מעודכן (הריצו migrate-latest.sql).";
}

export { mapResolveManagerError };
