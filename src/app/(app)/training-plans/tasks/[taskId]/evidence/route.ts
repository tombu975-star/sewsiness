import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: { taskId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: task }] = await Promise.all([
    admin.from("profiles").select("organization_id, role").eq("id", user.id).single(),
    admin.from("training_tasks").select("id, apprentice_id, organization_id, evidence_path").eq("id", params.taskId).single(),
  ]);
  if (!profile || !task || !task.evidence_path || task.organization_id !== profile.organization_id) return new NextResponse("Not found", { status: 404 });

  if (profile.role === "apprentice" && task.apprentice_id !== user.id) return new NextResponse("Forbidden", { status: 403 });
  if (profile.role === "trainer") {
    const { data: apprentice } = await admin.from("apprentice_profiles").select("trainer_id").eq("profile_id", task.apprentice_id).single();
    if (apprentice?.trainer_id !== user.id) return new NextResponse("Forbidden", { status: 403 });
  }
  if (!["owner", "manager", "trainer", "apprentice"].includes(profile.role)) return new NextResponse("Forbidden", { status: 403 });

  const { data, error } = await admin.storage.from("training-evidence").createSignedUrl(task.evidence_path, 600);
  if (error || !data?.signedUrl) return new NextResponse("Evidence unavailable", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}