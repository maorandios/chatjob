import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { managerFromRow } from "@/lib/supabase/mappers";
import {
  DEFAULT_COMPANY_NAME,
  DEFAULT_MANAGER_NAME,
  DEFAULT_MANAGER_PHONE,
} from "@/lib/mock/seed";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const managerId =
      typeof body.managerId === "string" ? body.managerId : undefined;

    const supabase = getSupabaseAdmin();

    if (managerId) {
      const { data: existing, error } = await supabase
        .from("managers")
        .select("*")
        .eq("id", managerId)
        .maybeSingle();

      if (error) throw error;
      if (existing) {
        return NextResponse.json({ manager: managerFromRow(existing) });
      }
    }

    const { data: created, error: createError } = await supabase
      .from("managers")
      .insert({
        name: DEFAULT_MANAGER_NAME,
        phone: DEFAULT_MANAGER_PHONE,
        company_name: DEFAULT_COMPANY_NAME,
      })
      .select("*")
      .single();

    if (createError) throw createError;

    return NextResponse.json({ manager: managerFromRow(created) });
  } catch (error) {
    console.error("Manager bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to bootstrap manager" },
      { status: 500 }
    );
  }
}
