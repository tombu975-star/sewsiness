import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCertificatePdf } from "@/lib/pdf/certificate";
import { siteUrl } from "@/lib/site-url";

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

  const { data: structuredCertificate } = await supabase
    .from("certificates")
    .select("certificate_number, verification_code, final_score, grade, issued_at, program:program_id(name, program_type)")
    .eq("apprentice_id", params.id)
    .is("revoked_at", null)
    .order("issued_at", { ascending: false })
    .maybeSingle();

  if (!structuredCertificate && !ap?.completed_at) {
    return new NextResponse("This apprentice's training hasn't been marked complete yet.", { status: 404 });
  }

  const certificate = structuredCertificate as any;
  const program = certificate?.program as any;
  const completedAt = certificate?.issued_at ?? ap?.completed_at;

  const pdfBytes = await buildCertificatePdf({
    apprenticeName: apprentice.full_name,
    organizationName: (apprentice as any).organizations?.name ?? "Sewsiness",
    specialisation: ap?.specialisation ?? null,
    trainingLevel: ap?.training_level ?? null,
    trainerName: (ap as any).trainer?.full_name ?? null,
    startDate: ap?.start_date ?? null,
    completedAt,
    certificateNumber: certificate?.certificate_number ?? ap?.certificate_number,
    programName: program?.name ?? null,
    programType: program?.program_type ?? null,
    grade: certificate?.grade ?? null,
    finalScore: certificate?.final_score ?? null,
    verificationCode: certificate?.verification_code ?? null,
    verificationUrl: certificate?.verification_code ? `${siteUrl()}/verify/${certificate.verification_code}` : null,
  });

  const safeName = apprentice.full_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName || "certificate"}-certificate.pdf"`,
    },
  });
}
