import { getLeads, getCrmStats } from "@/lib/actions/leads";
import { CrmContent } from "./_components/crm-content";

export default async function CrmPage() {
  const [leadsResult, statsResult] = await Promise.all([
    getLeads(),
    getCrmStats(),
  ]);

  return (
    <CrmContent 
      initialLeads={leadsResult.leads ?? []} 
      stats={statsResult.stats}
      needsFollowup={statsResult.needsFollowup ?? []}
    />
  );
}
