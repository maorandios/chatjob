import { normalizeEmail } from "@/lib/auth/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type WorkerAuthRow = { id: string; invite_token: string };

export async function findWorkerAuthByEmail(
  email: string
): Promise<WorkerAuthRow | null> {
  const normalized = normalizeEmail(email);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("workers")
    .select("id, invite_token")
    .eq("email", normalized)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function resolveWorkerInviteByEmail(email: string): Promise<{
  workerId: string;
  inviteToken: string;
}> {
  const found = await findWorkerAuthByEmail(email);
  if (!found) {
    throw new Error("לא נמצא עובד עם כתובת המייל הזאת");
  }

  return { workerId: found.id, inviteToken: found.invite_token };
}

export function mapResolveWorkerError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "לא ניתן להתחבר כרגע. נסו שוב.";
  }

  const msg = error.message.toLowerCase();
  if (msg.includes("לא נמצא עובד")) {
    return error.message;
  }
  if (msg.includes("relation") && msg.includes("does not exist")) {
    return "מסד הנתונים לא מוגדר. הריצו את supabase/schema.sql ב-Supabase.";
  }

  return "לא ניתן להשלים את ההתחברות. נסו שוב.";
}
