import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assertManagerIsAdmin } from "@/lib/supabase/company-access";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json({ error: "managerId required" }, { status: 400 });
    }

    if (id === managerId) {
      return NextResponse.json(
        { error: "לא ניתן להסיר את עצמך" },
        { status: 400 }
      );
    }

    const adminCheck = await assertManagerIsAdmin(managerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: target, error: lookupError } = await supabase
      .from("managers")
      .select("company_id, is_admin")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!target) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    if (target.company_id !== adminCheck.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (target.is_admin) {
      return NextResponse.json(
        { error: "לא ניתן להסיר מנהל ראשי" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("managers").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete manager error:", error);
    return NextResponse.json({ error: "Failed to delete manager" }, { status: 500 });
  }
}
