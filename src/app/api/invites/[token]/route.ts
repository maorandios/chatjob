import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/auth/email";
import { rowToManager, rowToWorker, rowToWorkerInvite } from "@/lib/supabase/mappers";
import {
  getManagersForWorkerMemberships,
  getWorkerMembershipByInviteToken,
} from "@/lib/supabase/worker-memberships";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ token: string }> };
type WorkerRow = Parameters<typeof rowToWorker>[0];

export async function GET(req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const membership = await getWorkerMembershipByInviteToken(token);

    const { data: workerRow, error: workerError } = await supabase
      .from("workers")
      .select("*")
      .eq("id", membership?.worker_id ?? "")
      .maybeSingle();

    if (workerError) throw workerError;
    if (!workerRow && !membership) {
      const legacy = await supabase
        .from("workers")
        .select("*")
        .eq("invite_token", token)
        .maybeSingle();

      if (legacy.error) throw legacy.error;
      if (!legacy.data) {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      }

      return getLegacyInviteResponse(req, legacy.data);
    }

    if (!workerRow || !membership) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", membership.company_id)
      .single();

    if (companyError) throw companyError;

    const invite = rowToWorkerInvite(workerRow, company, membership);
    const worker = rowToWorker(workerRow, membership);
    const authRequiredWorker = {
      ...worker,
      phone: "",
      email: undefined,
      employeeNumber: undefined,
      address: undefined,
      profileImageUrl: undefined,
    };
    const workerEmail = typeof workerRow.email === "string" ? workerRow.email : "";
    const requiresWorkerSession =
      workerRow.status === "active" && Boolean(workerEmail);

    if (requiresWorkerSession) {
      const authorization = req.headers.get("authorization") ?? "";
      const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

      if (!accessToken) {
        return NextResponse.json(
          {
            code: "WORKER_AUTH_REQUIRED",
            worker: authRequiredWorker,
            invite,
            managers: [],
          },
          { status: 401 }
        );
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(accessToken);

      const authenticatedEmail = user?.email
        ? normalizeEmail(user.email)
        : "";
      if (authError || authenticatedEmail !== normalizeEmail(workerEmail)) {
        return NextResponse.json(
          {
            code: "WORKER_AUTH_REQUIRED",
            worker: authRequiredWorker,
            invite,
            managers: [],
          },
          { status: 401 }
        );
      }
    }

    const managerPage = await getManagersForWorkerMemberships(
      workerRow.id,
      membership.company_id
    );

    return NextResponse.json({
      worker,
      invite,
      managers: managerPage.items,
    });
  } catch (error) {
    console.error("Invite lookup error:", error);
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  }
}

async function getLegacyInviteResponse(req: Request, workerRow: WorkerRow) {
  const supabase = getSupabaseAdmin();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", workerRow.company_id)
    .single();

  if (companyError) throw companyError;

  const invite = rowToWorkerInvite(workerRow, company);
  const worker = rowToWorker(workerRow);
  const authRequiredWorker = {
    ...worker,
    phone: "",
    email: undefined,
    employeeNumber: undefined,
    address: undefined,
    profileImageUrl: undefined,
  };
  const workerEmail = typeof workerRow.email === "string" ? workerRow.email : "";
  const requiresWorkerSession =
    workerRow.status === "active" && Boolean(workerEmail);

  if (requiresWorkerSession) {
    const authorization = req.headers.get("authorization") ?? "";
    const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!accessToken) {
      return NextResponse.json(
        {
          code: "WORKER_AUTH_REQUIRED",
          worker: authRequiredWorker,
          invite,
          managers: [],
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    const authenticatedEmail = user?.email
      ? normalizeEmail(user.email)
      : "";
    if (authError || authenticatedEmail !== normalizeEmail(workerEmail)) {
      return NextResponse.json(
        {
          code: "WORKER_AUTH_REQUIRED",
          worker: authRequiredWorker,
          invite,
          managers: [],
        },
        { status: 401 }
      );
    }
  }

  const { data: managers, error: managersError } = await supabase
    .from("managers")
    .select("*")
    .eq("company_id", workerRow.company_id)
    .not("email", "is", null)
    .eq("onboarding_complete", true)
    .order("created_at", { ascending: false });

  if (managersError) throw managersError;

  return NextResponse.json({
    worker,
    invite,
    managers: (managers ?? []).map(rowToManager),
  });
}
