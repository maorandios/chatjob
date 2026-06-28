import { getAuthenticatedEmailFromRequest } from "@/lib/auth/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertAuthenticatedWorkerRequest,
  getManagerCompanyId,
  getWorkerCompanyId,
} from "@/lib/supabase/company-access";
import { NextResponse } from "next/server";

type PushSubscriptionBody = {
  userRole?: "manager" | "worker";
  userId?: string;
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
};

async function assertManagerRequest(req: Request, managerId: string) {
  const companyId = await getManagerCompanyId(managerId);
  if (!companyId) return false;

  try {
    const email = await getAuthenticatedEmailFromRequest(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("managers")
      .select("email")
      .eq("id", managerId)
      .maybeSingle();

    if (error) throw error;
    return !data?.email || data.email.toLowerCase() === email;
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PushSubscriptionBody;
    const userRole = body.userRole;
    const userId = String(body.userId ?? "");
    const endpoint = String(body.subscription?.endpoint ?? "");
    const p256dh = String(body.subscription?.keys?.p256dh ?? "");
    const auth = String(body.subscription?.keys?.auth ?? "");

    if (
      (userRole !== "manager" && userRole !== "worker") ||
      !userId ||
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        { error: "Invalid push subscription" },
        { status: 400 }
      );
    }

    const authorized =
      userRole === "worker"
        ? await assertAuthenticatedWorkerRequest(req, userId)
        : await assertManagerRequest(req, userId);

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId =
      userRole === "worker"
        ? await getWorkerCompanyId(userId)
        : await getManagerCompanyId(userId);

    if (!companyId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_role: userRole,
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: req.headers.get("user-agent"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Save push subscription error:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 }
    );
  }
}

