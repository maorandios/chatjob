import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assertManagerIsAdmin } from "@/lib/supabase/company-access";
import { companyFromRow } from "@/lib/supabase/mappers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const managerId = String(body.managerId ?? "");

    if (!managerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminCheck = await assertManagerIsAdmin(managerId);
    if (!adminCheck || adminCheck.companyId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: { name?: string } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updates.name = name;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ company: companyFromRow(data) });
  } catch (error) {
    console.error("Update company error:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}
