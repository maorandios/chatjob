import { acceptWorkerInvite } from "@/lib/auth/accept-worker-invite";
import { getAuthenticatedEmailFromRequest } from "@/lib/auth/server-auth";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const email = await getAuthenticatedEmailFromRequest(req);
    const workerId = await acceptWorkerInvite(token, email);

    return NextResponse.json({ workerId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "נדרש אימות מייל" }, { status: 401 });
    }

    if (error instanceof Error) {
      if (
        error.message.includes("כבר בשימוש") ||
        error.message.includes("כבר שויכה")
      ) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("אינו תקין")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    console.error("Accept worker invite error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "לא ניתן להשלים את ההצטרפות",
      },
      { status: 500 }
    );
  }
}
