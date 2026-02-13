"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewLeadDialog } from "./new-lead-dialog";
import { LeadCard } from "./lead-card";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  Phone, 
  Calendar,
  TrendingUp,
  Clock
} from "lucide-react";

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

interface CrmStats {
  total: number;
  newCount: number;
  contactedCount: number;
  interestedCount: number;
  trialScheduledCount: number;
  convertedCount: number;
  needsFollowupCount: number;
}

interface CrmContentProps {
  initialLeads: Lead[];
  stats: CrmStats;
  needsFollowup: Lead[];
}

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  trial_scheduled: "تجربة مجدولة",
  trial_completed: "تجربة مكتملة",
  converted: "تحول لطالب",
  not_interested: "غير مهتم",
  waiting_other_area: "منطقة أخرى",
};

export function CrmContent({ initialLeads, stats, needsFollowup }: CrmContentProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Filter leads
  const filteredLeads = initialLeads.filter((lead) => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.childName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Group leads by status for pipeline view
  const newLeads = filteredLeads.filter(l => l.status === "new");
  const contactedLeads = filteredLeads.filter(l => l.status === "contacted");
  const interestedLeads = filteredLeads.filter(l => l.status === "interested");
  const trialLeads = filteredLeads.filter(l => ["trial_scheduled", "trial_completed"].includes(l.status));

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">العملاء المحتملين</h1>
        <Button onClick={() => setShowNewDialog(true)}>
          <UserPlus className="h-4 w-4 ml-2" />
          عميل جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                <p className="text-xs text-blue-600">إجمالي</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.convertedCount}</p>
                <p className="text-xs text-green-600">تحولوا</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.trialScheduledCount}</p>
                <p className="text-xs text-amber-600">تجارب</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">{stats.needsFollowupCount}</p>
                <p className="text-xs text-red-600">متابعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="بحث بالاسم أو الهاتف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipeline" dir="rtl">
        <TabsList className="w-full">
          <TabsTrigger value="pipeline" className="flex-1">المسار</TabsTrigger>
          <TabsTrigger value="followup" className="flex-1">
            متابعة ({stats.needsFollowupCount})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">الكل</TabsTrigger>
        </TabsList>

        {/* Pipeline View */}
        <TabsContent value="pipeline" className="mt-4 space-y-4">
          {/* New */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge className="bg-blue-500">جديد</Badge>
                <span className="text-muted-foreground">({newLeads.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {newLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">لا يوجد</p>
              ) : (
                newLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Contacted */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge className="bg-purple-500">تم التواصل</Badge>
                <span className="text-muted-foreground">({contactedLeads.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contactedLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">لا يوجد</p>
              ) : (
                contactedLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Interested */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge className="bg-amber-500">مهتم</Badge>
                <span className="text-muted-foreground">({interestedLeads.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {interestedLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">لا يوجد</p>
              ) : (
                interestedLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Trial */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge className="bg-green-500">تجربة</Badge>
                <span className="text-muted-foreground">({trialLeads.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {trialLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">لا يوجد</p>
              ) : (
                trialLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-up View */}
        <TabsContent value="followup" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">يحتاج متابعة اليوم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {needsFollowup.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  لا يوجد عملاء يحتاجون متابعة
                </p>
              ) : (
                needsFollowup.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} showFollowupDate />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Leads View */}
        <TabsContent value="all" className="mt-4">
          {/* Status Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
            >
              الكل
            </Button>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={selectedStatus === key ? "default" : "outline"}
                onClick={() => setSelectedStatus(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredLeads.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد عملاء
                </CardContent>
              </Card>
            ) : (
              filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <NewLeadDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
}
