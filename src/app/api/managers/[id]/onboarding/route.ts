import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { companyFromRow, rowToManager } from "@/lib/supabase/mappers";
import { isValidIsraeliPhone, normalizePhone } from "@/lib/utils";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id: managerId } = await context.params;
    const body = await req.json().catch(() => ({}));

    const companyName = String(body.companyName ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));

    if (!companyName) {
      return NextResponse.json({ error: "נא להזין שם חברה" }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ error: "נא להזין שם מלא" }, { status: 400 });
    }
    if (!isValidIsraeliPhone(phone)) {
      return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
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
    if (!manager.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (manager.onboarding_complete) {
      return NextResponse.json({ error: "Onboarding already complete" }, { status: 409 });
    }

    const { error: companyError } = await supabase
      .from("companies")
      .update({ name: companyName })
      .eq("id", manager.company_id);

    if (companyError) throw companyError;

    const { data: updatedManager, error: updateManagerError } = await supabase
      .from("managers")
      .update({
        name: fullName,
        phone,
        onboarding_complete: true,
      })
      .eq("id", managerId)
      .select("*")
      .single();

    if (updateManagerError) throw updateManagerError;

    const { data: company, error: companyLoadError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", manager.company_id)
      .single();

    if (companyLoadError) throw companyLoadError;

    return NextResponse.json({
      manager: rowToManager(updatedManager),
      company: companyFromRow(company),
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
