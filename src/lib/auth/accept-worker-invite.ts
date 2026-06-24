import { normalizeEmail } from "@/lib/auth/email";
import { findWorkerAuthByEmail } from "@/lib/auth/find-worker-by-email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateInviteToken } from "@/lib/supabase/tokens";
import { getWorkerMembershipByInviteToken } from "@/lib/supabase/worker-memberships";

const EMAIL_ALREADY_USED_MESSAGE =
  "כתובת המייל כבר בשימוש על ידי משתמש אחר";

export async function validateWorkerInviteEmail(
  inviteToken: string,
  email: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  const supabase = getSupabaseAdmin();
  const membership = await getWorkerMembershipByInviteToken(inviteToken);

  const { data: worker, error } = await supabase
    .from("workers")
    .select("id, email")
    .eq("id", membership?.worker_id ?? "")
    .maybeSingle();

  if (error) throw error;
  if (!worker && !membership) {
    const legacy = await supabase
      .from("workers")
      .select("id, email")
      .eq("invite_token", inviteToken)
      .maybeSingle();

    if (legacy.error) throw legacy.error;
    if (!legacy.data) {
      throw new Error("קישור ההזמנה אינו תקין");
    }

    const existing = await findWorkerAuthByEmail(normalized);
    if (legacy.data.email) {
      if (legacy.data.email.toLowerCase() === normalized) return;
      throw new Error("הזמנה זו כבר שויכה לכתובת מייל אחרת");
    }
    if (existing && existing.id !== legacy.data.id) {
      throw new Error(EMAIL_ALREADY_USED_MESSAGE);
    }
    return;
  }

  if (!worker) {
    throw new Error("קישור ההזמנה אינו תקין");
  }

  if (worker.email) {
    if (worker.email.toLowerCase() === normalized) return;
    throw new Error("הזמנה זו כבר שויכה לכתובת מייל אחרת");
  }

  const existing = await findWorkerAuthByEmail(normalized);
  if (existing && existing.id !== worker.id && !membership) {
    throw new Error(EMAIL_ALREADY_USED_MESSAGE);
  }
}

export async function acceptWorkerInvite(
  inviteToken: string,
  authenticatedEmail: string
): Promise<string> {
  const normalized = normalizeEmail(authenticatedEmail);
  const supabase = getSupabaseAdmin();
  const membership = await getWorkerMembershipByInviteToken(inviteToken);

  const { data: worker, error } = await supabase
    .from("workers")
    .select("id, email")
    .eq("id", membership?.worker_id ?? "")
    .maybeSingle();

  if (error) throw error;
  if (!worker && !membership) {
    const legacy = await supabase
      .from("workers")
      .select("id, email")
      .eq("invite_token", inviteToken)
      .maybeSingle();

    if (legacy.error) throw legacy.error;
    if (!legacy.data) {
      throw new Error("קישור ההזמנה אינו תקין");
    }

    return acceptLegacyWorkerInvite(legacy.data, normalized);
  }

  if (!worker || !membership) {
    throw new Error("קישור ההזמנה אינו תקין");
  }

  if (worker.email) {
    if (worker.email.toLowerCase() === normalized) {
      await supabase
        .from("worker_company_memberships")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", membership.id);
      return worker.id;
    }
    throw new Error("הזמנה זו כבר שויכה לכתובת מייל אחרת");
  }

  const existing = await findWorkerAuthByEmail(normalized);
  if (existing && existing.id !== worker.id) {
    const { data: existingMembership, error: existingMembershipError } = await supabase
      .from("worker_company_memberships")
      .select("*")
      .eq("worker_id", existing.id)
      .eq("company_id", membership.company_id)
      .maybeSingle();

    if (existingMembershipError) throw existingMembershipError;

    if (existingMembership) {
      await supabase
        .from("worker_company_memberships")
        .update({
          invite_token: generateInviteToken(),
          status: "revoked",
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id);

      const { error: activateExistingError } = await supabase
        .from("worker_company_memberships")
        .update({
          invite_token: inviteToken,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMembership.id);

      if (activateExistingError) throw activateExistingError;
      return existing.id;
    }

    const { error: moveMembershipError } = await supabase
      .from("worker_company_memberships")
      .update({
        worker_id: existing.id,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", membership.id);

    if (moveMembershipError) throw moveMembershipError;
    return existing.id;
  }

  const { data: updated, error: updateError } = await supabase
    .from("workers")
    .update({ email: normalized, status: "active" })
    .eq("id", worker.id)
    .is("email", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    if (updateError.code === "23505") {
      throw new Error(EMAIL_ALREADY_USED_MESSAGE);
    }
    throw updateError;
  }

  if (updated?.id) {
    const { error: membershipError } = await supabase
      .from("worker_company_memberships")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", membership.id);

    if (membershipError) throw membershipError;
    return updated.id;
  }

  const raced = await supabase
    .from("workers")
    .select("id, email")
    .eq("id", worker.id)
    .single();

  if (raced.error) throw raced.error;
  if (raced.data.email?.toLowerCase() === normalized) {
    return raced.data.id;
  }

  throw new Error("לא ניתן לשייך את כתובת המייל להזמנה");
}

async function acceptLegacyWorkerInvite(
  worker: { id: string; email: string | null },
  normalized: string
): Promise<string> {
  const supabase = getSupabaseAdmin();

  if (worker.email) {
    if (worker.email.toLowerCase() === normalized) {
      await supabase
        .from("workers")
        .update({ status: "active" })
        .eq("id", worker.id)
        .eq("status", "pending");
      return worker.id;
    }
    throw new Error("הזמנה זו כבר שויכה לכתובת מייל אחרת");
  }

  const existing = await findWorkerAuthByEmail(normalized);
  if (existing && existing.id !== worker.id) {
    throw new Error(EMAIL_ALREADY_USED_MESSAGE);
  }

  const { data: updated, error: updateError } = await supabase
    .from("workers")
    .update({ email: normalized, status: "active" })
    .eq("id", worker.id)
    .is("email", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    if (updateError.code === "23505") {
      throw new Error(EMAIL_ALREADY_USED_MESSAGE);
    }
    throw updateError;
  }

  if (updated?.id) return updated.id;
  throw new Error("לא ניתן לשייך את כתובת המייל להזמנה");
}
