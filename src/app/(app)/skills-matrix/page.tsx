import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { createSkill, setSkillLevel } from "./actions";

const LEVEL_LABELS = ["Not started", "Novice", "Developing", "Competent", "Proficient", "Expert"];
const LEVEL_STYLE = [
  "bg-sunken text-ink-faint",
  "bg-danger-soft text-danger",
  "bg-warning/10 text-warning",
  "bg-indigo-soft text-indigo",
  "bg-success/10 text-success",
  "bg-gold-soft text-gold-ink",
];

export default async function SkillsMatrixPage() {
  const { user, profile } = await requirePageRegistryFeature(
    ["owner", "manager", "trainer", "apprentice"],
    "apprentices"
  );
  const supabase = createClient();
  const canManage = profile.role === "owner" || profile.role === "manager" || profile.role === "trainer";
  const canCreateSkill = profile.role === "owner" || profile.role === "manager";

  const [{ data: skills }, { data: apprentices }, { data: levels }] = await Promise.all([
    supabase.from("skills").select("id, name, category").eq("organization_id", profile.organization_id).order("category").order("name"),
    profile.role === "apprentice"
      ? supabase.from("profiles").select("id, full_name").eq("id", user.id)
      : supabase.from("profiles").select("id, full_name").eq("organization_id", profile.organization_id).eq("role", "apprentice").order("full_name"),
    supabase.from("apprentice_skill_levels").select("apprentice_id, skill_id, level, assessed_at"),
  ]);

  const levelMap = new Map((levels ?? []).map((l: any) => [`${l.apprentice_id}:${l.skill_id}`, l.level as number]));
  const skillRows = (skills ?? []) as any[];
  const apprenticeRows = (apprentices ?? []) as any[];

  return (
    <div>
      <PageHead
        title={profile.role === "apprentice" ? "My Skills" : "Skills Matrix"}
        subtitle="Competency levels tracked per apprentice, independent of any specific program."
        crumb="Learning"
      />

      {canCreateSkill && (
        <form action={createSkill} className="card p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="field-label">Skill name</label>
            <input name="name" required placeholder="e.g. Pattern drafting" className="field-input" />
          </div>
          <div>
            <label className="field-label">Category (optional)</label>
            <input name="category" placeholder="e.g. Cutting" className="field-input" />
          </div>
          <SubmitButton>Add skill</SubmitButton>
          <div className="md:col-span-4">
            <label className="field-label">Description (optional)</label>
            <input name="description" placeholder="What does mastering this skill look like?" className="field-input" />
          </div>
        </form>
      )}

      {skillRows.length === 0 ? (
        <EmptyState
          icon="✎"
          title="No skills defined yet."
          description={canCreateSkill ? "Add the competencies your apprentices should develop." : "Your organization hasn't defined any skills yet."}
        />
      ) : apprenticeRows.length === 0 ? (
        <EmptyState icon="☺" title="No apprentices to assess." description="Invite an apprentice to start tracking skill levels." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-ink-muted text-xs uppercase p-3 sticky left-0 bg-surface">Apprentice</th>
                {skillRows.map((s) => (
                  <th key={s.id} className="text-left font-semibold text-ink-muted text-xs uppercase p-3 whitespace-nowrap">
                    {s.name}
                    {s.category && <div className="text-[10px] font-normal normal-case text-ink-faint">{s.category}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apprenticeRows.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-semibold text-ink sticky left-0 bg-surface whitespace-nowrap">{a.full_name}</td>
                  {skillRows.map((s) => {
                    const level = levelMap.get(`${a.id}:${s.id}`) ?? 0;
                    return (
                      <td key={s.id} className="p-3">
                        {canManage ? (
                          <form action={setSkillLevel}>
                            <input type="hidden" name="apprentice_id" value={a.id} />
                            <input type="hidden" name="skill_id" value={s.id} />
                            <select
                              name="level"
                              defaultValue={level}
                              onChange={(e) => e.currentTarget.form?.requestSubmit()}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 ${LEVEL_STYLE[level]}`}
                            >
                              {LEVEL_LABELS.map((label, i) => (
                                <option key={i} value={i}>{label}</option>
                              ))}
                            </select>
                          </form>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${LEVEL_STYLE[level]}`}>{LEVEL_LABELS[level]}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
