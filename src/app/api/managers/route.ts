import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertManagerIsAdmin,
  getManagerCompanyId,
} from "@/lib/supabase/company-access";
import { rowToManager } from "@/lib/supabase/mappers";
import {
  getManagersForWorkerMemberships,
  getWorkerMembershipByInviteToken,
} from "@/lib/supabase/worker-memberships";
import { generateInviteToken } from "@/lib/supabase/tokens";
import { normalizePhone } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");
    const workerToken = searchParams.get("workerToken");

    const supabase = getSupabaseAdmin();
    let companyId: string | null = null;

    if (managerId) {
      companyId = await getManagerCompanyId(managerId);
    } else if (workerToken) {
      const membership = await getWorkerMembershipByInviteToken(workerToken);
      if (membership) {
        const managers = await getManagersForWorkerMemberships(
          membership.worker_id,
          membership.company_id
        );

        return NextResponse.json({ managers });
      }

      const { data: worker, error } = await supabase
        .from("workers")
        .select("id, company_id")
        .eq("invite_token", workerToken)
        .maybeSingle();

      if (error) throw error;
      if (worker) {
        const managers = await getManagersForWorkerMemberships(
          worker.id,
          worker.company_id
        );

        return NextResponse.json({ managers });
      }
    } else {
      return NextResponse.json(
        { error: "managerId or workerToken required" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let query = supabase
      .from("managers")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (workerToken) {
      query = query
        .not("email", "is", null)
        .eq("onboarding_complete", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      managers: (data ?? []).map(rowToManager),
    });
  } catch (error) {
    console.error("List managers error:", error);
    return NextResponse.json({ error: "Failed to load managers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestingManagerId = String(body.managerId ?? "");
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));

    if (!requestingManagerId || !name) {
      return NextResponse.json({ error: "Invalid manager data" }, { status: 400 });
    }

    const adminCheck = await assertManagerIsAdmin(requestingManagerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = adminCheck.companyId;
    const supabase = getSupabaseAdmin();

    const inviteToken = generateInviteToken();

    const { data, error } = await supabase
      .from("managers")
      .insert({
        company_id: companyId,
        name,
        phone,
        invite_token: inviteToken,
        is_admin: false,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ manager: rowToManager(data) });
  } catch (error) {
    console.error("Create manager error:", error);
    return NextResponse.json({ error: "Failed to create manager" }, { status: 500 });
  }
}
