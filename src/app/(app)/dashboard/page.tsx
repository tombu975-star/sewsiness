import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth/require-role";
import { OwnerDashboard } from "./OwnerDashboard";
import { StaffDashboard } from "./StaffDashboard";
import { TrainerDashboard } from "./TrainerDashboard";
import { ApprenticeDashboard } from "./ApprenticeDashboard";
import { FreelancerDashboard } from "./FreelancerDashboard";

// /dashboard is the one landing page shared by six different roles
// (see homePathForRole/ROLES in nav.ts — Owner, Manager, Staff,
// Trainer, Apprentice and Freelancer all land here; Super Admin and
// System Admin have their own separate /admin and /system). It used to
// render one Owner-shaped view for everyone regardless of role — full
// revenue and outstanding-balance figures shown even to an Apprentice,
// "+ New Custom Order" offered to a Freelancer who can't create one.
// This just dispatches to a real per-role view; nav.ts already implied
// this split (it labels this same href "Freelancer Hub" for freelancer
// and "My Training" for apprentice) without the page ever having
// followed through on it.
export default async function DashboardPage() {
  const { user, profile } = await requirePageRole(["owner", "manager", "staff", "trainer", "freelancer", "apprentice"]);
  const role = profile.role;

  switch (role) {
    case "staff":
      return <StaffDashboard userId={user.id} />;
    case "trainer":
      return <TrainerDashboard userId={user.id} />;
    case "apprentice":
      return <ApprenticeDashboard userId={user.id} />;
    case "freelancer":
      return <FreelancerDashboard userId={user.id} />;
    default:
      return <OwnerDashboard userId={user.id} role={role} />;
  }
}
