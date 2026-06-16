import { normalizeEmail } from "@/lib/auth/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function getAuthenticatedEmailFromRequest(
  req: Request
): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!bearer) {
    throw new Error("Unauthorized");
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(bearer);

  if (error || !user?.email) {
    throw new Error("Unauthorized");
  }

  return normalizeEmail(user.email);
}
