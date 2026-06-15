import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertManagerIsAdmin,
  getManagerCompanyId,
} from "@/lib/supabase/company-access";
import { rowToManager } from "@/lib/supabase/mappers";
import { isValidIsraeliPhone, normalizePhone } from "@/lib/utils";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const requestingManagerId = String(body.managerId ?? "");

    if (!requestingManagerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    let companyId: string | null = null;

    if (requestingManagerId === id) {
      companyId = await getManagerCompanyId(requestingManagerId);
      if (!companyId) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }
    } else {
      const adminCheck = await assertManagerIsAdmin(requestingManagerId);
      if (!adminCheck) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: target, error: lookupError } = await supabase
        .from("managers")
        .select("company_id")
        .eq("id", id)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!target) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }

      if (target.company_id !== adminCheck.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      companyId = adminCheck.companyId;
    }

    const updates: { name?: string; phone?: string } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.phone !== undefined) {
      const phone = normalizePhone(String(body.phone));
      if (!isValidIsraeliPhone(phone)) {
        return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
      }
      updates.phone = phone;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("managers")
      .update(updates)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ manager: rowToManager(data) });
  } catch (error) {
    console.error("Update manager error:", error);
    return NextResponse.json({ error: "Failed to update manager" }, { status: 500 });
  }
}

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
