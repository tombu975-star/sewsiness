import { PageHead } from "@/components/PageHead";
import { InviteFreelancerForm } from "./InviteFreelancerForm";

export default function NewFreelancerPage() {
  return (
    <div>
      <PageHead
        title="Invite Freelancer"
        subtitle="Sends an email invite to set a password and sign in — same pattern used for Staff."
        crumb="Freelancers / Invite"
      />
      <InviteFreelancerForm />
    </div>
  );
}
