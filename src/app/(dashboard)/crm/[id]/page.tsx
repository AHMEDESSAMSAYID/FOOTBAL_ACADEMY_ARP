import { notFound } from "next/navigation";
import { getLead } from "@/lib/actions/leads";
import { LeadDetail } from "./_components/lead-detail";

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params;
  const result = await getLead(id);

  if (!result.success || !result.lead) {
    notFound();
  }

  return (
    <LeadDetail 
      lead={result.lead} 
      communications={result.communications ?? []} 
    />
  );
}
