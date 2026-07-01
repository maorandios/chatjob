import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertAuthenticatedWorkerRequest,
  assertManagerIsAdmin,
  assertSameCompanyParticipants,
} from "@/lib/supabase/company-access";
import { rowToWorker } from "@/lib/supabase/mappers";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import { isValidIsraeliPhone, normalizePhone } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const managerId = new URL(req.url).searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json({ error: "managerId required" }, { status: 400 });
    }

    const companyId = await assertSameCompanyParticipants(managerId, id);
    if (!companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const [{ data: workerRow, error: workerError }, { data: membership, error: membershipError }] =
      await Promise.all([
        supabase.from("workers").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("worker_company_memberships")
          .select("*")
          .eq("worker_id", id)
          .eq("company_id", companyId)
          .neq("status", "revoked")
          .maybeSingle(),
      ]);

    if (workerError) throw workerError;
    if (membershipError) throw membershipError;
    if (!workerRow || !membership) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({ worker: rowToWorker(workerRow, membership) });
  } catch (error) {
    console.error("Get worker error:", error);
    return NextResponse.json({ error: "Failed to load worker" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updates: {
      language?: string;
      status?: "pending" | "active";
    } = {};

    if (body.language) {
      updates.language = normalizeWorkerLanguage(body.language as LanguageCode);
    } else if (body.status === "pending" || body.status === "active") {
      updates.status = body.status;
    }

    if (
      body.name !== undefined ||
      body.phone !== undefined ||
      body.privateNote !== undefined
    ) {
      const managerId = String(body.managerId ?? "");
      if (!managerId) {
        return NextResponse.json({ error: "managerId required" }, { status: 400 });
      }

      const companyId = await assertSameCompanyParticipants(managerId, id);
      if (!companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const membershipUpdates: {
        display_name?: string | null;
        display_phone?: string | null;
        private_note?: string | null;
        updated_at: string;
      } = {
        updated_at: new Date().toISOString(),
      };
      let aliasName = "";
      let aliasPhone = "";

      if (body.phone !== undefined) {
        const phone = normalizePhone(String(body.phone));
        if (phone && !isValidIsraeliPhone(phone)) {
          return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
        }
        membershipUpdates.display_phone = phone || null;
        aliasPhone = phone;
      }

      if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (!name) {
          return NextResponse.json({ error: "Invalid name" }, { status: 400 });
        }
        membershipUpdates.display_name = name;
        aliasName = name;
      }

      if (body.privateNote !== undefined) {
        const privateNote = String(body.privateNote).trim();
        membershipUpdates.private_note = privateNote || null;
      }

      const supabase = getSupabaseAdmin();
      const { data: membership, error: membershipError } = await supabase
        .from("worker_company_memberships")
        .update(membershipUpdates)
        .eq("worker_id", id)
        .eq("company_id", companyId)
        .select("*")
        .single();

      if (membershipError) throw membershipError;

      const { error: aliasError } = await supabase.from("contact_aliases").upsert(
        {
          company_id: companyId,
          owner_role: "manager",
          owner_id: managerId,
          contact_role: "worker",
          contact_id: id,
          display_name: aliasName || null,
          display_phone: aliasPhone || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "owner_role,owner_id,contact_role,contact_id",
        }
      );
      if (aliasError) throw aliasError;

      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return NextResponse.json({ worker: rowToWorker(data, membership) });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("workers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ worker: rowToWorker(data) });
  } catch (error) {
    console.error("Update worker error:", error);
    return NextResponse.json({ error: "Failed to update worker" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    const supabase = getSupabaseAdmin();

    if (!managerId) {
      if (!(await assertAuthenticatedWorkerRequest(req, id))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await supabase
        .from("contact_aliases")
        .delete()
        .or(`owner_id.eq.${id},contact_id.eq.${id}`);

      const { error } = await supabase.from("workers").delete().eq("id", id);
      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    const adminCheck = await assertManagerIsAdmin(managerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership, error: lookupError } = await supabase
      .from("worker_company_memberships")
      .select("id")
      .eq("worker_id", id)
      .eq("company_id", adminCheck.companyId)
      .neq("status", "revoked")
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!membership) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("worker_company_memberships")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", membership.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete worker error:", error);
    return NextResponse.json({ error: "Failed to delete worker" }, { status: 500 });
  }
}
