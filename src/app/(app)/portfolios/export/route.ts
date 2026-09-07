import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPortfolioPdf } from "@/lib/pdf/portfolio";

// GET /portfolios/export — self-export for an Apprentice (no query
// param needed, always their own), or ?apprentice_id=<id> for
// Owner/Manager/Trainer exporting on behalf of someone on the roster.
// Matches the existing /portfolios page's own access pattern exactly
// (see PortfoliosPage: apprentice sees only their own rows, everyone
// else sees the whole org) rather than introducing a stricter rule
// here that would just contradict what the on-screen page already
// allows the same person to see.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  if (!caller) return new NextResponse("Not found", { status: 404 });

  const isApprentice = caller.role === "apprentice";
  const targetId = isApprentice ? user.id : searchParams.get("apprentice_id") ?? "";
  if (!targetId) return new NextResponse("Missing apprentice_id", { status: 400 });
  if (!isApprentice && !["owner", "manager", "trainer", "super_admin"].includes(caller.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data: apprentice } = await supabase
    .from("profiles")
    .select("full_name, organization_id, organizations(name)")
    .eq("id", targetId)
    .single();
  if (!apprentice || apprentice.organization_id !== caller.organization_id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: apInfo } = await supabase
    .from("apprentice_profiles")
    .select("specialisation, training_level")
    .eq("profile_id", targetId)
    .maybeSingle();

  const { data: items } = await supabase
    .from("portfolio_items")
    .select("title, description, image_url, created_at")
    .eq("apprentice_id", targetId)
    .eq("organization_id", caller.organization_id)
    .order("created_at", { ascending: true });

  const pdfBytes = await buildPortfolioPdf({
    apprenticeName: apprentice.full_name,
    organizationName: (apprentice as any).organizations?.name ?? "Sewsiness",
    specialisation: apInfo?.specialisation ?? null,
    trainingLevel: apInfo?.training_level ?? null,
    items: (items ?? []) as any[],
  });

  const safeName = apprentice.full_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName || "portfolio"}-portfolio.pdf"`,
    },
  });
}
