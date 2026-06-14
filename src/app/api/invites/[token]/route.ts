import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToManager, rowToWorker, rowToWorkerInvite } from "@/lib/supabase/mappers";
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

    const [{ data: company, error: companyError }, { data: managers, error: managersError }] =
      await Promise.all([
        supabase
          .from("companies")
          .select("*")
          .eq("id", workerRow.company_id)
          .single(),
        supabase
          .from("managers")
          .select("*")
          .eq("company_id", workerRow.company_id)
          .order("created_at", { ascending: false }),
      ]);

    if (companyError) throw companyError;
    if (managersError) throw managersError;

    const invite = rowToWorkerInvite(workerRow, company);

    return NextResponse.json({
      worker: rowToWorker(workerRow),
      invite,
      managers: (managers ?? []).map(rowToManager),
    });
  } catch (error) {
    console.error("Invite lookup error:", error);
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  }
}
