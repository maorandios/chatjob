import { normalizeEmail } from "@/lib/auth/email";
import { findManagerIdByEmail } from "@/lib/auth/find-manager-by-email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const EMAIL_ALREADY_USED_MESSAGE =
  "כתובת המייל כבר בשימוש על ידי משתמש אחר";

export async function validateInviteEmail(
  inviteToken: string,
  email: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  const supabase = getSupabaseAdmin();

  const { data: manager, error } = await supabase
    .from("managers")
    .select("id, email")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) throw error;
  if (!manager) {
    throw new Error("קישור ההזמנה אינו תקין");
  }

  if (manager.email) {
    if (manager.email.toLowerCase() === normalized) {
      return;
    }
    throw new Error("הזמנה זו כבר שויכה לכתובת מייל אחרת");
  }

  const existingId = await findManagerIdByEmail(normalized);
  if (existingId && existingId !== manager.id) {
    throw new Error(EMAIL_ALREADY_USED_MESSAGE);
  }
}

export async function acceptManagerInvite(
  inviteToken: string,
  authenticatedEmail: string
): Promise<string> {
  const normalized = normalizeEmail(authenticatedEmail);
  const supabase = getSupabaseAdmin();

  const { data: manager, error } = await supabase
    .from("managers")
    .select("id, email")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) throw error;
  if (!manager) {
    throw new Error("קישור ההזמנה אינו תקין");
  }

  if (manager.email) {
    if (manager.email.toLowerCase() === normalized) {
      return manager.id;
    }
    throw new Error("הזמנה זו כבר שויכה לכתובת מייל אחרת");
  }

  const existingId = await findManagerIdByEmail(normalized);
  if (existingId && existingId !== manager.id) {
    throw new Error(EMAIL_ALREADY_USED_MESSAGE);
  }

  const { data: updated, error: updateError } = await supabase
    .from("managers")
    .update({ email: normalized })
    .eq("id", manager.id)
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
    .from("managers")
    .select("id, email")
    .eq("id", manager.id)
    .single();

  if (raced.error) throw raced.error;
  if (raced.data.email?.toLowerCase() === normalized) {
    return raced.data.id;
  }

  throw new Error("לא ניתן לשייך את כתובת המייל להזמנה");
}
