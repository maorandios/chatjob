import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToInvite, rowToWorker } from "@/lib/supabase/mappers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: workerRow, error: workerError } = await supabase
      .from("workers")
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();

    if (workerError) throw workerError;
    if (!workerRow) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const { data: manager, error: managerError } = await supabase
      .from("managers")
      .select("*")
      .eq("id", workerRow.manager_id)
      .single();

    if (managerError) throw managerError;

    return NextResponse.json({
      worker: rowToWorker(workerRow),
      invite: rowToInvite(workerRow, manager),
    });
  } catch (error) {
    console.error("Invite lookup error:", error);
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  }
}
