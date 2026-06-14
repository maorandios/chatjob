import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assertSameCompanyParticipants } from "@/lib/supabase/company-access";
import { rowToMessage } from "@/lib/supabase/mappers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const workerId = String(body.workerId ?? "");
    const managerId = String(body.managerId ?? "");
    const viewerRole = body.viewerRole as "manager" | "worker";

    if (!workerId || !managerId) {
      return NextResponse.json(
        { error: "workerId and managerId required" },
        { status: 400 }
      );
    }
    if (viewerRole !== "manager" && viewerRole !== "worker") {
      return NextResponse.json({ error: "Invalid viewerRole" }, { status: 400 });
    }

    const companyId = await assertSameCompanyParticipants(managerId, workerId);
    if (!companyId) {
      return NextResponse.json({ error: "Invalid conversation" }, { status: 403 });
    }

    const senderRole = viewerRole === "manager" ? "worker" : "manager";
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("messages")
      .update({ status: "delivered" })
      .eq("manager_id", managerId)
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
