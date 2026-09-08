import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCertificatePdf } from "@/lib/pdf/certificate";
import { getApprenticeCertificateStatus } from "@/lib/apprentice-certificate";
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
    .maybeSingle();
  if (!apprentice || apprentice.organization_id !== caller.organization_id) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Single source of truth for "is a certificate ready?" — see
  // apprentice-certificate.ts for why this used to be three separately
  // hand-written (and quietly inconsistent) copies of the same check.
  const status = await getApprenticeCertificateStatus(supabase, params.id);

  if (!status.ready) {
    return new NextResponse("This apprentice's training hasn't been marked complete yet.", { status: 404 });
  }

  const pdfBytes = await buildCertificatePdf({
    apprenticeName: apprentice.full_name,
    organizationName: (apprentice as any).organizations?.name ?? "Sewsiness",
    specialisation: status.specialisation,
    trainingLevel: status.trainingLevel,
    trainerName: status.trainerName,
    startDate: status.startDate,
    completedAt: status.completedAt!,
    certificateNumber: status.certificateNumber,
    programName: status.structured?.programName ?? null,
    programType: status.structured?.programType ?? null,
    grade: status.structured?.grade ?? null,
    finalScore: status.structured?.finalScore ?? null,
    verificationCode: status.structured?.verificationCode ?? null,
    verificationUrl: status.structured?.verificationCode ? `${siteUrl()}/verify/${status.structured.verificationCode}` : null,
  });

  const safeName = apprentice.full_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName || "certificate"}-certificate.pdf"`,
    },
  });
}
