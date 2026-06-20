import { normalizeEmail } from "@/lib/auth/email";
import {
  findWorkerAuthByEmail,
  mapResolveWorkerError,
} from "@/lib/auth/find-worker-by-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email) {
      return NextResponse.json({ error: "נא להזין אימייל" }, { status: 400 });
    }

    const worker = await findWorkerAuthByEmail(email);
    if (!worker) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      workerId: worker.id,
      inviteToken: worker.invite_token,
    });
  } catch (error) {
    console.error("Resolve worker error:", error);
    return NextResponse.json(
      { error: mapResolveWorkerError(error) },
      { status: 500 }
    );
  }
}
