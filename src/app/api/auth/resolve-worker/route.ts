import { normalizeEmail } from "@/lib/auth/email";
import {
  findWorkerAuthByEmail,
  mapResolveWorkerError,
} from "@/lib/auth/find-worker-by-email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email) {
      return NextResponse.json({ error: "נא להזין אימייל" }, { status: 400 });
    }

    const worker = await findWorkerAuthByEmail(email);
    if (!worker) {
      return NextResponse.json({ found: false });
    }

    const supabase = getSupabaseAdmin();
    const { data: membership, error: membershipError } = await supabase
      .from("worker_company_memberships")
      .select("invite_token")
      .eq("worker_id", worker.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;

    return NextResponse.json({
      found: true,
      workerId: worker.id,
      inviteToken: membership?.invite_token ?? worker.invite_token,
    });
  } catch (error) {
    console.error("Resolve worker error:", error);
    return NextResponse.json(
      { error: mapResolveWorkerError(error) },
      { status: 500 }
    );
  }
}
