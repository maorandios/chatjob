import { normalizeEmail } from "@/lib/auth/email";
import { findWorkerAuthByEmail } from "@/lib/auth/find-worker-by-email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const EMAIL_ALREADY_USED_MESSAGE =
  "כתובת המייל כבר בשימוש על ידי משתמש אחר";

export async function validateWorkerInviteEmail(
  inviteToken: string,
  email: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  const supabase = getSupabaseAdmin();

  const { data: worker, error } = await supabase
    .from("workers")
    .select("id, email")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) throw error;
  if (!worker) {
    throw new Error("קישור ההזמנה אינו תקין");
  }

  if (worker.email) {
    if (worker.email.toLowerCase() === normalized) return;
    throw new Error("הזמנה זו כבר שויכה לכתובת מייל אחרת");
  }

  const existing = await findWorkerAuthByEmail(normalized);
  if (existing && existing.id !== worker.id) {
    throw new Error(EMAIL_ALREADY_USED_MESSAGE);
  }
}

export async function acceptWorkerInvite(
  inviteToken: string,
  authenticatedEmail: string
): Promise<string> {
  const normalized = normalizeEmail(authenticatedEmail);
  const supabase = getSupabaseAdmin();

  const { data: worker, error } = await supabase
    .from("workers")
    .select("id, email")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) throw error;
  if (!worker) {
    throw new Error("קישור ההזמנה אינו תקין");
  }

  if (worker.email) {
    if (worker.email.toLowerCase() === normalized) {
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
    .update({ email: normalized })
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
