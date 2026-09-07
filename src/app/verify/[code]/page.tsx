import { createClient } from "@/lib/supabase/server";

export default async function VerifyCertificatePage({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_certificate_for_verification", { code: params.code });
  const certificate = Array.isArray(data) ? data[0] : data;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <section className="card w-full max-w-xl p-8 text-center">
        <div className="eyebrow justify-center mb-3">Certificate verification</div>
        {!certificate ? <><h1 className="font-display text-2xl font-semibold text-ink">Certificate not found</h1><p className="text-sm text-ink-muted mt-2">This verification code is invalid or the certificate is not available.</p></> : <>
          <h1 className="font-display text-3xl font-semibold text-ink">Training certificate</h1>
          <p className="text-sm text-ink-muted mt-2">This record confirms that the following learner completed the listed program.</p>
          <div className="mt-6 space-y-3 text-left border-t border-border pt-5">
            <div className="flex justify-between gap-4"><span className="text-ink-muted">Learner</span><strong className="text-ink">{certificate.apprentice_name}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-ink-muted">Program</span><strong className="text-ink">{certificate.program_name}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-ink-muted">Standard</span><strong className="text-ink">{certificate.program_type === "tvet" ? "TVET" : "Workplace"}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-ink-muted">Grade</span><strong className="text-ink">{certificate.grade} ({Number(certificate.final_score).toFixed(1)}%)</strong></div>
            <div className="flex justify-between gap-4"><span className="text-ink-muted">Certificate number</span><strong className="text-ink">{certificate.certificate_number}</strong></div>
          </div>
          {certificate.revoked_at && <p className="mt-5 rounded-lg bg-danger-soft p-3 text-sm font-semibold text-danger">This certificate was revoked{certificate.revoked_reason ? `: ${certificate.revoked_reason}` : "."}</p>}
        </>}
      </section>
    </main>
  );
}