import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertAuthenticatedWorkerRequest,
  getManagerCompanyId,
  getWorkerCompanyId,
} from "@/lib/supabase/company-access";
import { NextResponse } from "next/server";

type OwnerRole = "manager" | "worker";
type ContactRole = "manager" | "worker" | "self";

function toContactAliases(
  ownerRole: OwnerRole,
  rows: Array<{
    contact_role: string;
    contact_id: string;
    display_name: string | null;
    display_phone: string | null;
  }>
) {
  const aliases = { manager: {}, worker: {} } as {
    manager: Record<string, { name?: string; phone?: string }>;
    worker: Record<string, { name?: string; phone?: string }>;
  };

  for (const row of rows) {
    aliases[ownerRole][row.contact_id] = {
      name: row.display_name ?? undefined,
      phone: row.display_phone ?? undefined,
    };
  }

  return aliases;
}

async function resolveOwnerCompany(
  req: Request,
  ownerRole: OwnerRole,
  ownerId: string
): Promise<string | null> {
  if (ownerRole === "manager") {
    return getManagerCompanyId(ownerId);
  }

  if (!(await assertAuthenticatedWorkerRequest(req, ownerId))) {
    return null;
  }
  return getWorkerCompanyId(ownerId);
}

async function resolveContactCompany(
  contactRole: ContactRole,
  contactId: string
): Promise<string | null> {
  if (contactRole === "manager") return getManagerCompanyId(contactId);
  return getWorkerCompanyId(contactId);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerRole = searchParams.get("ownerRole") as OwnerRole;
    const ownerId = searchParams.get("ownerId") ?? "";

    if ((ownerRole !== "manager" && ownerRole !== "worker") || !ownerId) {
      return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
    }

    const companyId = await resolveOwnerCompany(req, ownerRole, ownerId);
    if (!companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("contact_aliases")
      .select("contact_role, contact_id, display_name, display_phone")
      .eq("company_id", companyId)
      .eq("owner_role", ownerRole)
      .eq("owner_id", ownerId);

    if (error) throw error;

    return NextResponse.json({ aliases: toContactAliases(ownerRole, data ?? []) });
  } catch (error) {
    console.error("List contact aliases error:", error);
    return NextResponse.json(
      { error: "Failed to load contact aliases" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const ownerRole = body.ownerRole as OwnerRole;
    const ownerId = String(body.ownerId ?? "");
    const contactRole = body.contactRole as ContactRole;
    const contactId = String(body.contactId ?? "");
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (
      (ownerRole !== "manager" && ownerRole !== "worker") ||
      (contactRole !== "manager" &&
        contactRole !== "worker" &&
        contactRole !== "self") ||
      !ownerId ||
      !contactId
    ) {
      return NextResponse.json({ error: "Invalid alias" }, { status: 400 });
    }

    const companyId = await resolveOwnerCompany(req, ownerRole, ownerId);
    if (!companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const effectiveContactRole =
      contactRole === "self" && ownerRole === "worker" ? "worker" : contactRole;
    const contactCompanyId = await resolveContactCompany(
      effectiveContactRole,
      contactId
    );
    if (!contactCompanyId || contactCompanyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("contact_aliases").upsert(
      {
        company_id: companyId,
        owner_role: ownerRole,
        owner_id: ownerId,
        contact_role: contactRole,
        contact_id: contactId,
        display_name: name || null,
        display_phone: phone || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "owner_role,owner_id,contact_role,contact_id",
      }
    );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Save contact alias error:", error);
    return NextResponse.json(
      { error: "Failed to save contact alias" },
      { status: 500 }
    );
  }
}
