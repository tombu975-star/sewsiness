import { PageHead } from "@/components/PageHead";
import { EnrollBusinessForm } from "./EnrollBusinessForm";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function EnrollBusinessPage() {
  await requirePageRole(["super_admin"]);
  return (
    <div>
      <PageHead title="Enroll Business" crumb="Platform Admin / Enroll Business" />
      <EnrollBusinessForm />
    </div>
  );
}
