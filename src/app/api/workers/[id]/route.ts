import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assertManagerIsAdmin } from "@/lib/supabase/company-access";
import { rowToWorker } from "@/lib/supabase/mappers";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import type { LanguageCode } from "@/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updates: {
      language?: string;
      status?: "pending" | "active";
    } = {};

    if (body.language) {
      updates.language = normalizeWorkerLanguage(body.language as LanguageCode);
      updates.status = "active";
    } else if (body.status === "pending" || body.status === "active") {
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("workers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ worker: rowToWorker(data) });
  } catch (error) {
    console.error("Update worker error:", error);
    return NextResponse.json({ error: "Failed to update worker" }, { status: 500 });
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

    const adminCheck = await assertManagerIsAdmin(managerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: worker, error: lookupError } = await supabase
      .from("workers")
      .select("company_id")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    if (worker.company_id !== adminCheck.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete worker error:", error);
    return NextResponse.json({ error: "Failed to delete worker" }, { status: 500 });
  }
}
