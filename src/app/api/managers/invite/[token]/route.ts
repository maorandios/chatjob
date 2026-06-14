import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToManager } from "@/lib/supabase/mappers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("managers")
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Manager invite not found" }, { status: 404 });
    }

    return NextResponse.json({ manager: rowToManager(data) });
  } catch (error) {
    console.error("Manager invite lookup error:", error);
    return NextResponse.json(
      { error: "Failed to load manager invite" },
      { status: 500 }
    );
  }
}
