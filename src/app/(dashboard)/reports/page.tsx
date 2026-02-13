import { getReportsData } from "@/lib/actions/reports";
import { ReportsContent } from "./_components/reports-content";

export default async function ReportsPage() {
  const result = await getReportsData();

  return (
    <ReportsContent
      data={result.success ? result.data! : undefined}
      error={result.success ? undefined : result.error}
    />
  );
}
