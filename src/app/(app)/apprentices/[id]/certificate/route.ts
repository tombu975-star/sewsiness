import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCertificatePdf } from "@/lib/pdf/certificate";

// A Route Handler rather than a Server Action, since the point is a
// binary file download with its own Content-Type/Content-Disposition —
// a plain `<a href>` to this URL. Uses the normal (RLS-respecting)
// server client throughout, not the admin client: everything read here
// is already covered by existing SELECT policies (org members can read
// profiles/apprentice_profiles), so there's no reason to bypass RLS for
// a read-only endpoint.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  if (!caller) return new NextResponse("Not found", { status: 404 });

  const isSelf = user.id === params.id;
  const canManage = ["owner", "manager", "trainer", "super_admin"].includes(caller.role);
  if (!isSelf && !canManage) return new NextResponse("Forbidden", { status: 403 });

  const { data: apprentice } = await supabase
    .from("profiles")
    .select("full_name, organization_id, organizations(name)")
    .eq("id", params.id)
    .single();
  if (!apprentice || apprentice.organization_id !== caller.organization_id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: ap } = await supabase
    .from("apprentice_profiles")
    .select("training_level, specialisation, start_date, completed_at, certificate_number, trainer:trainer_id(full_name)")
    .eq("profile_id", params.id)
    .maybeSingle();

  if (!ap?.completed_at) {
    return new NextResponse("This apprentice's training hasn't been marked complete yet.", { status: 404 });
  }

  const pdfBytes = await buildCertificatePdf({
    apprenticeName: apprentice.full_name,
    organizationName: (apprentice as any).organizations?.name ?? "Sewsiness",
    specialisation: ap.specialisation,
    trainingLevel: ap.training_level,
    trainerName: (ap as any).trainer?.full_name ?? null,
    startDate: ap.start_date,
    completedAt: ap.completed_at,
    certificateNumber: ap.certificate_number,
  });

  const safeName = apprentice.full_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName || "certificate"}-certificate.pdf"`,
    },
  });
}
