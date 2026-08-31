import { PageHead } from "@/components/PageHead";
import { EnrollBusinessForm } from "./EnrollBusinessForm";

export default function EnrollBusinessPage() {
  return (
    <div>
      <PageHead title="Enroll Business" crumb="Platform Admin / Enroll Business" />
      <EnrollBusinessForm />
    </div>
  );
}
