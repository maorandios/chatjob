import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertManagerIsAdmin,
  getManagerCompanyId,
} from "@/lib/supabase/company-access";
import { rowToWorker, rowToWorkerInvite } from "@/lib/supabase/mappers";
import {
  ensureWorkerCompanyMembership,
  getAccessibleWorkersForCompany,
} from "@/lib/supabase/worker-memberships";
import { generateInviteToken } from "@/lib/supabase/tokens";
import { normalizePhone } from "@/lib/utils";
import { CONTACT_PAGE_SIZE } from "@/lib/constants/limits";
import { NextResponse } from "next/server";

type WorkerRow = Parameters<typeof rowToWorker>[0];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : CONTACT_PAGE_SIZE;
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;
    const query = searchParams.get("q") ?? "";
    const activeOnly = searchParams.get("activeOnly") === "true";

    if (!managerId) {
      return NextResponse.json({ error: "managerId required" }, { status: 400 });
    }

    const companyId = await getManagerCompanyId(managerId);
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const page = await getAccessibleWorkersForCompany(companyId, {
      limit,
      offset,
      query,
      activeOnly,
    });

    return NextResponse.json({
      workers: page.items,
      hasMore: page.hasMore,
      total: page.total,
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
    const email = String(body.email ?? "").trim().toLowerCase();
    const privateNote = String(body.privateNote ?? "").trim();

    if (!requestingManagerId || !name) {
      return NextResponse.json({ error: "Invalid worker data" }, { status: 400 });
    }

    const adminCheck = await assertManagerIsAdmin(requestingManagerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = adminCheck.companyId;
    const supabase = getSupabaseAdmin();

    const inviteToken = generateInviteToken();

    let workerRow: WorkerRow | null = null;
    if (email) {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;
      workerRow = data;
    }

    if (!workerRow && phone) {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("phone", phone)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      workerRow = data;
    }

    if (!workerRow) {
      const { data, error: workerError } = await supabase
        .from("workers")
        .insert({
          company_id: companyId,
          name,
          phone,
          email: email || null,
          status: email ? "active" : "pending",
          invite_token: generateInviteToken(),
        })
        .select("*")
        .single();

      if (workerError) throw workerError;
      workerRow = data;
    }

    const membership = await ensureWorkerCompanyMembership({
      workerId: workerRow.id,
      companyId,
      createdByManagerId: requestingManagerId,
      inviteToken,
      status: "pending",
      displayName: name,
      displayPhone: phone,
      privateNote,
    });

    const { error: aliasError } = await supabase.from("contact_aliases").upsert(
      {
        company_id: companyId,
        owner_role: "manager",
        owner_id: requestingManagerId,
        contact_role: "worker",
        contact_id: workerRow.id,
        display_name: name,
        display_phone: phone || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "owner_role,owner_id,contact_role,contact_id",
      }
    );
    if (aliasError) throw aliasError;

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError) throw companyError;

    const worker = rowToWorker(workerRow, membership);
    const invite = rowToWorkerInvite(workerRow, company, membership);

    return NextResponse.json({ worker, invite });
  } catch (error) {
    console.error("Create worker error:", error);
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}
