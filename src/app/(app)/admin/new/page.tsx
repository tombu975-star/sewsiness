import { PageHead } from "@/components/PageHead";
import { requirePageRole } from "@/lib/auth/require-role";
import { EnrollBusinessForm } from "./EnrollBusinessForm";

export default async function EnrollBusinessPage() {
  await requirePageRole(["super_admin"]);
  return (
    <div>
      <PageHead title="Enroll Business" crumb="Platform Admin / Enroll Business" />
      <EnrollBusinessForm />
    </div>
  );
}
