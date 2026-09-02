import { requirePageRole } from "@/lib/auth/require-role";
import { PlannerClient } from "./PlannerClient";

export default async function ProjectionsPlannerPage() {
  await requirePageRole(["owner", "manager"]);
  return <PlannerClient />;
}
