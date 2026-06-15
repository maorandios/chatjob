import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertManagerIsAdmin,
  getManagerCompanyId,
} from "@/lib/supabase/company-access";
import { rowToWorker, rowToWorkerInvite } from "@/lib/supabase/mappers";
import { generateInviteToken } from "@/lib/supabase/tokens";
import { normalizePhone } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json({ error: "managerId required" }, { status: 400 });
    }

    const companyId = await getManagerCompanyId(managerId);
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      workers: (data ?? []).map(rowToWorker),
    });
  } catch (error) {
    console.error("List workers error:", error);
    return NextResponse.json({ error: "Failed to load workers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestingManagerId = String(body.managerId ?? "");
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));
    const employeeNumber = String(body.employeeNumber ?? "").trim();
    const address = String(body.address ?? "").trim();

    if (!requestingManagerId || !name || !phone) {
      return NextResponse.json({ error: "Invalid worker data" }, { status: 400 });
    }

    const adminCheck = await assertManagerIsAdmin(requestingManagerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = adminCheck.companyId;
    const supabase = getSupabaseAdmin();

    const inviteToken = generateInviteToken();

    const { data: workerRow, error: workerError } = await supabase
      .from("workers")
      .insert({
        company_id: companyId,
        name,
        phone,
        employee_number: employeeNumber || null,
        address: address || null,
        status: "pending",
        invite_token: inviteToken,
      })
      .select("*")
      .single();

    if (workerError) throw workerError;

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError) throw companyError;

    const worker = rowToWorker(workerRow);
    const invite = rowToWorkerInvite(workerRow, company);

    return NextResponse.json({ worker, invite });
  } catch (error) {
    console.error("Create worker error:", error);
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}
