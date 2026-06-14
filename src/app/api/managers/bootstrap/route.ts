import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_ADMIN_NAME,
  DEFAULT_ADMIN_PHONE,
  DEFAULT_COMPANY_NAME,
} from "@/lib/mock/seed";
import { companyFromRow, rowToManager, rowToWorker } from "@/lib/supabase/mappers";
import { generateInviteToken } from "@/lib/supabase/tokens";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const managerId =
      typeof body.managerId === "string" && body.managerId
        ? body.managerId
        : undefined;
    const inviteToken =
      typeof body.inviteToken === "string" && body.inviteToken
        ? body.inviteToken
        : undefined;

    const supabase = getSupabaseAdmin();

    async function loadTeam(companyId: string) {
      const [{ data: managers, error: managersError }, { data: workers, error: workersError }] =
        await Promise.all([
          supabase
            .from("managers")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),
          supabase
            .from("workers")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),
        ]);

      if (managersError) throw managersError;
      if (workersError) throw workersError;

      return {
        managers: (managers ?? []).map(rowToManager),
        workers: (workers ?? []).map(rowToWorker),
      };
    }

    async function loadManagerBundle(id: string) {
      const { data: manager, error } = await supabase
        .from("managers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!manager) return null;

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", manager.company_id)
        .single();

      if (companyError) throw companyError;

      const team = await loadTeam(manager.company_id);

      return {
        manager: rowToManager(manager),
        company: companyFromRow(company),
        ...team,
      };
    }

    async function getOrCreateAdminManagerId() {
      const token = generateInviteToken();
      const { data, error } = await supabase.rpc("slang_bootstrap_admin", {
        p_company_name: DEFAULT_COMPANY_NAME,
        p_admin_name: DEFAULT_ADMIN_NAME,
        p_admin_phone: DEFAULT_ADMIN_PHONE,
        p_invite_token: token,
      });

      if (error) throw error;
      return typeof data === "string" ? data : null;
    }

    if (inviteToken) {
      const { data: byToken, error } = await supabase
        .from("managers")
        .select("id")
        .eq("invite_token", inviteToken)
        .maybeSingle();

      if (error) throw error;
      if (byToken) {
        const bundle = await loadManagerBundle(byToken.id);
        if (bundle) return NextResponse.json(bundle);
      }

      return NextResponse.json(
        { error: "קישור ההזמנה אינו תקין", code: "INVITE_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (managerId) {
      const bundle = await loadManagerBundle(managerId);
      if (bundle) return NextResponse.json(bundle);
    }

    const adminManagerId = await getOrCreateAdminManagerId();
    if (adminManagerId) {
      const bundle = await loadManagerBundle(adminManagerId);
      if (bundle) return NextResponse.json(bundle);
    }

    return NextResponse.json(
      {
        error: "לא ניתן להתחבר. פתחו את קישור ההזמנה שנשלח אליכם.",
        code: "SESSION_NOT_FOUND",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Manager bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to bootstrap manager" },
      { status: 500 }
    );
  }
}
