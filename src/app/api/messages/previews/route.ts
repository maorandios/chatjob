import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertAuthenticatedWorkerRequest,
  getManagerCompanyId,
  getWorkerCompanyId,
} from "@/lib/supabase/company-access";
import { rowToMessage } from "@/lib/supabase/mappers";
import type { Message } from "@/types";
import { NextResponse } from "next/server";

type MessageRow = Parameters<typeof rowToMessage>[0];

function latestPerConversation(
  rows: MessageRow[],
  key: "worker_id" | "manager_id"
): Message[] {
  const latest = new Map<string, MessageRow>();

  for (const row of rows) {
    const id = row[key];
    if (!id || latest.has(id)) continue;
    latest.set(id, row);
  }

  return Array.from(latest.values()).map(rowToMessage);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");
    const workerId = searchParams.get("workerId");

    if (!managerId && !workerId) {
      return NextResponse.json(
        { error: "managerId or workerId required" },
        { status: 400 }
      );
    }

    if (managerId && workerId) {
      return NextResponse.json(
        { error: "Provide managerId or workerId, not both" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (managerId) {
      const companyId = await getManagerCompanyId(managerId);
      if (!companyId) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("manager_id", managerId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return NextResponse.json({
        previews: latestPerConversation(data ?? [], "worker_id"),
      });
    }

    const companyId = await getWorkerCompanyId(workerId!);
    if (!companyId) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }
    if (!(await assertAuthenticatedWorkerRequest(req, workerId!))) {
      return NextResponse.json(
        { error: "Worker login required", code: "WORKER_AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("worker_id", workerId!)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      previews: latestPerConversation(data ?? [], "manager_id"),
    });
  } catch (error) {
    console.error("Message previews error:", error);
    return NextResponse.json(
      { error: "Failed to load message previews" },
      { status: 500 }
    );
  }
}
