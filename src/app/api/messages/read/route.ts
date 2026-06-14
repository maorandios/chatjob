import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToMessage } from "@/lib/supabase/mappers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const workerId = String(body.workerId ?? "");
    const viewerRole = body.viewerRole as "manager" | "worker";

    if (!workerId) {
      return NextResponse.json({ error: "workerId required" }, { status: 400 });
    }
    if (viewerRole !== "manager" && viewerRole !== "worker") {
      return NextResponse.json({ error: "Invalid viewerRole" }, { status: 400 });
    }

    const senderRole = viewerRole === "manager" ? "worker" : "manager";
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("messages")
      .update({ status: "delivered" })
      .eq("worker_id", workerId)
      .eq("sender_role", senderRole)
      .eq("status", "sent")
      .select("*");

    if (error) throw error;

    return NextResponse.json({
      messages: (data ?? []).map(rowToMessage),
    });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Failed to mark messages read" }, { status: 500 });
  }
}
