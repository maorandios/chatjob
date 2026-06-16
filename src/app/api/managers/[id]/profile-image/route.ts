import {
  assertManagerIsAdmin,
  getManagerCompanyId,
} from "@/lib/supabase/company-access";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { uploadManagerProfileImage } from "@/lib/supabase/manager-profile-image";
import { rowToManager } from "@/lib/supabase/mappers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const requestingManagerId = String(body.managerId ?? "");
    const imageDataUrl = String(body.imageDataUrl ?? "");

    if (!requestingManagerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    let companyId: string | null = null;

    if (requestingManagerId === id) {
      companyId = await getManagerCompanyId(requestingManagerId);
      if (!companyId) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }
    } else {
      const adminCheck = await assertManagerIsAdmin(requestingManagerId);
      if (!adminCheck) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const supabase = getSupabaseAdmin();
      const { data: target, error: lookupError } = await supabase
        .from("managers")
        .select("company_id")
        .eq("id", id)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!target) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }

      if (target.company_id !== adminCheck.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      companyId = adminCheck.companyId;
    }

    const profileImageUrl = await uploadManagerProfileImage(
      companyId,
      id,
      imageDataUrl
    );

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("managers")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      manager: rowToManager(data),
      profileImageUrl,
    });
  } catch (error) {
    console.error("Upload manager profile image error:", error);
    return NextResponse.json(
      { error: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}
