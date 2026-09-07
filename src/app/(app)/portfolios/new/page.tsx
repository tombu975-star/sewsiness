import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { addPortfolioItem } from "../actions";
import { PortfolioForm } from "./PortfolioForm";

export default async function NewPortfolioItemPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isApprentice = profile?.role === "apprentice";
  const organizationId = profile?.organization_id ?? "";

  const { data: apprentices } = isApprentice
    ? { data: [] }
    : await supabase.from("profiles").select("id, full_name").eq("organization_id", organizationId).eq("role", "apprentice").order("full_name");

  return (
    <div>
      <PageHead title="Add Portfolio Piece" crumb="Apprentices / Portfolios / New" />
      <PortfolioForm
        action={addPortfolioItem}
        organizationId={organizationId}
        apprentices={isApprentice ? null : (apprentices ?? [])}
      />
    </div>
  );
}
