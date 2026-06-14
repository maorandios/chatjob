import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
