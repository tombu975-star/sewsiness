import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PlannerClient } from "./PlannerClient";

export default async function ProjectionsPlannerPage() {
  await requirePageRegistryFeature(["owner", "manager"], "projections");
  return <PlannerClient />;
}
