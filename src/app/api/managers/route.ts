import { MAX_MANAGERS_PER_COMPANY } from "@/lib/constants/limits";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertManagerIsAdmin,
  getManagerCompanyId,
} from "@/lib/supabase/company-access";
import { rowToManager } from "@/lib/supabase/mappers";
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
      const { data: worker, error } = await supabase
        .from("workers")
        .select("company_id")
        .eq("invite_token", workerToken)
        .maybeSingle();

      if (error) throw error;
      companyId = worker?.company_id ?? null;
    } else {
      return NextResponse.json(
        { error: "managerId or workerToken required" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("managers")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

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

    if (!requestingManagerId || !name || !phone) {
      return NextResponse.json({ error: "Invalid manager data" }, { status: 400 });
    }

    const adminCheck = await assertManagerIsAdmin(requestingManagerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = adminCheck.companyId;
    const supabase = getSupabaseAdmin();

    const { count, error: countError } = await supabase
      .from("managers")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (countError) throw countError;
    if ((count ?? 0) >= MAX_MANAGERS_PER_COMPANY) {
      return NextResponse.json(
        { error: `ניתן להוסיף עד ${MAX_MANAGERS_PER_COMPANY} מנהלים` },
        { status: 409 }
      );
    }

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

    if (error) {
      if (error.message.includes("SLANG_MANAGER_LIMIT")) {
        return NextResponse.json(
          { error: `ניתן להוסיף עד ${MAX_MANAGERS_PER_COMPANY} מנהלים` },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ manager: rowToManager(data) });
  } catch (error) {
    console.error("Create manager error:", error);
    return NextResponse.json({ error: "Failed to create manager" }, { status: 500 });
  }
}
