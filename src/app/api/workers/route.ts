import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToInvite, rowToWorker } from "@/lib/supabase/mappers";
import { normalizePhone } from "@/lib/utils";
import { NextResponse } from "next/server";

function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json({ error: "managerId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: workers, error } = await supabase
      .from("workers")
      .select("*")
      .eq("manager_id", managerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      workers: (workers ?? []).map(rowToWorker),
    });
  } catch (error) {
    console.error("List workers error:", error);
    return NextResponse.json({ error: "Failed to load workers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const managerId = String(body.managerId ?? "");
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));

    if (!managerId || !name || !phone) {
      return NextResponse.json({ error: "Invalid worker data" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: manager, error: managerError } = await supabase
      .from("managers")
      .select("*")
      .eq("id", managerId)
      .maybeSingle();

    if (managerError) throw managerError;
    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    const inviteToken = generateInviteToken();

    const { data: workerRow, error: workerError } = await supabase
      .from("workers")
      .insert({
        manager_id: managerId,
        name,
        phone,
        status: "pending",
        invite_token: inviteToken,
      })
      .select("*")
      .single();

    if (workerError) throw workerError;

    const worker = rowToWorker(workerRow);
    const invite = rowToInvite(workerRow, manager);

    return NextResponse.json({ worker, invite });
  } catch (error) {
    console.error("Create worker error:", error);
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}
