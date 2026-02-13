"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";

interface Lead {
  id: string;
  name: string;
  phone: string;
  childName: string | null;
  age: number | null;
  area: string | null;
  status: string;
  source: string | null;
  nextFollowup: string | null;
  createdAt: Date;
}

interface LeadCardProps {
  lead: Lead;
  showFollowupDate?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "جديد", variant: "default" },
  contacted: { label: "تم التواصل", variant: "secondary" },
  interested: { label: "مهتم", variant: "default" },
  trial_scheduled: { label: "تجربة مجدولة", variant: "default" },
  trial_completed: { label: "تجربة مكتملة", variant: "default" },
  converted: { label: "تحول", variant: "default" },
  not_interested: { label: "غير مهتم", variant: "destructive" },
  waiting_other_area: { label: "منطقة أخرى", variant: "outline" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function LeadCard({ lead, showFollowupDate }: LeadCardProps) {
  const statusConfig = STATUS_CONFIG[lead.status] || { label: lead.status, variant: "outline" as const };
  const router = useRouter();

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
      onClick={() => router.push(`/crm/${lead.id}`)}
    >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{lead.name}</p>
            <Badge variant={statusConfig.variant} className="text-xs shrink-0">
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {lead.childName && (
              <span>الطفل: {lead.childName}</span>
            )}
            {lead.age && (
              <span>({lead.age} سنة)</span>
            )}
            {lead.area && (
              <span>• {lead.area}</span>
            )}
          </div>
          {showFollowupDate && lead.nextFollowup && (
            <p className="text-xs text-amber-600 mt-1">
              موعد المتابعة: {formatDate(lead.nextFollowup)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={`tel:${lead.phone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        </div>
    </div>
  );
}
