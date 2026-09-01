import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { AssessmentForm } from "./AssessmentForm";
import type { Answers } from "@/lib/onboarding/scoring";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function AssessmentPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const orgId = profile?.organization_id ?? "";

  const { data: draft } = await supabase
    .from("onboarding_assessments")
    .select("answers")
    .eq("organization_id", orgId)
    .eq("status", "draft")
    .maybeSingle();

  const answers = (draft?.answers as Answers) ?? {};

  return (
    <div>
      <PageHead
        title="Business Health Assessment"
        subtitle="Answer each section honestly — this drives your Business Health Score and the recommendations you'll see on the overview page."
        crumb="Business Health / Assessment"
        actions={<Button href="/business-health" variant="outline">Back to overview</Button>}
      />
      <AssessmentForm answers={answers} />
    </div>
  );
}
