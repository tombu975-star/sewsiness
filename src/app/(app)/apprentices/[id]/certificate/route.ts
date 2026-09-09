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
//
// Every early return below logs a distinct reason before responding —
// this route used to return a bare "Not found" for several unrelated
// causes (missing profile row, org mismatch, RLS denial, not yet
// certificate-eligible), which made a real report of "it 404s"
// undiagnosable after the fact with no server log to check. The
// response bodies are distinct per cause too, so the visible symptom
// alone is enough to tell which branch fired.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized — please sign in again.", { status: 401 });

  const { data: caller, error: callerErr } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  if (!caller) {
    console.error(`[certificate] no profile row for caller ${user.id}`, callerErr);
    return new NextResponse("We couldn't find your account profile. Please contact support.", { status: 404 });
  }

  const isSelf = user.id === params.id;
  const canManage = ["owner", "manager", "trainer", "super_admin"].includes(caller.role);
  if (!isSelf && !canManage) return new NextResponse("You don't have permission to download this certificate.", { status: 403 });

  const { data: apprentice, error: apprenticeErr } = await supabase
    .from("profiles")
    .select("full_name, organization_id, organizations(name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!apprentice) {
    // Also fires if RLS silently filtered the row (cross-org access,
    // or a stale/deleted profile id) — logged distinctly from the org
    // mismatch below so the two causes can't be confused when reading
    // logs later.
    console.error(`[certificate] profile ${params.id} not readable by caller ${user.id} (org ${caller.organization_id})`, apprenticeErr);
    return new NextResponse("Apprentice profile not found.", { status: 404 });
  }
  if (apprentice.organization_id !== caller.organization_id) {
    console.error(`[certificate] org mismatch: apprentice ${params.id} is in org ${apprentice.organization_id}, caller is in ${caller.organization_id}`);
    return new NextResponse("Apprentice profile not found.", { status: 404 });
  }

  // Single source of truth for "is a certificate ready?" — see
  // apprentice-certificate.ts for why this used to be three separately
  // hand-written (and quietly inconsistent) copies of the same check.
  const status = await getApprenticeCertificateStatus(supabase, params.id);

  if (!status.ready) {
    // The common real-world cause: an enrollment can reach
    // program_enrollments.status = "completed" (every task approved)
    // without a certificate ever being issued, if the final score came
    // in below the program's pass_score — see
    // completeIfAllTasksApproved() in training-plans/actions.ts, which
    // deliberately does NOT insert a certificates row in that case.
    // "Completed" and "certified" are different things.
    console.error(`[certificate] apprentice ${params.id} has no issued certificate and no legacy completed_at — training not yet certificate-eligible`);
    return new NextResponse(
      "No certificate is available yet — training must be marked complete (or a program enrollment must reach a passing final score) before a certificate is issued.",
      { status: 404 }
    );
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await buildCertificatePdf({
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
  } catch (err) {
    // Unguarded before — a thrown error here would surface as whatever
    // generic error page the host renders, easy to mistake for the
    // "not eligible" 404 above when someone's just describing the
    // symptom ("it 404s") rather than reading the status code. This is
    // a 500 (something broke), never a 404 (nothing to show).
    console.error(`[certificate] PDF generation failed for apprentice ${params.id}`, err);
    return new NextResponse("Couldn't generate the certificate file. Please try again or contact support.", { status: 500 });
  }

  const safeName = apprentice.full_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName || "certificate"}-certificate.pdf"`,
    },
  });
}
