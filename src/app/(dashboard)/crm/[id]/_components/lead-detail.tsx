"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  updateLeadStatus, 
  addCommunication, 
  convertLeadToStudent,
  updateLead,
  type LeadStatus
} from "@/lib/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Phone, 
  ArrowRight, 
  MessageCircle,
  Calendar,
  UserPlus,
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
  convertedToStudentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Communication {
  id: string;
  communicationDate: Date;
  channel: string | null;
  notes: string;
  outcome: string | null;
  nextAction: string | null;
}

interface LeadDetailProps {
  lead: Lead;
  communications: Communication[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-blue-500" },
  contacted: { label: "تم التواصل", color: "bg-purple-500" },
  interested: { label: "مهتم", color: "bg-amber-500" },
  trial_scheduled: { label: "تجربة مجدولة", color: "bg-cyan-500" },
  trial_completed: { label: "تجربة مكتملة", color: "bg-emerald-500" },
  converted: { label: "تحول لطالب", color: "bg-green-500" },
  not_interested: { label: "غير مهتم", color: "bg-red-500" },
  waiting_other_area: { label: "منطقة أخرى", color: "bg-gray-500" },
};

const CHANNEL_LABELS: Record<string, string> = {
  call: "اتصال",
  whatsapp: "واتساب",
  visit: "زيارة",
  other: "أخرى",
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(d);
}

export function LeadDetail({ lead, communications }: LeadDetailProps) {
  const router = useRouter();
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showCommDialog, setShowCommDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Communication form state
  const [commNotes, setCommNotes] = useState("");
  const [commChannel, setCommChannel] = useState<string>("");
  const [commOutcome, setCommOutcome] = useState("");
  const [commNextAction, setCommNextAction] = useState("");

  // Convert form state
  const [convertAgeGroup, setConvertAgeGroup] = useState<"5-10" | "10-15" | "15+">("5-10");

  const statusConfig = STATUS_CONFIG[lead.status] || { label: lead.status, color: "bg-gray-500" };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdating(true);
    try {
      const result = await updateLeadStatus(lead.id, newStatus);
      if (result.success) {
        toast.success("تم تحديث الحالة");
        router.refresh();
      } else {
        toast.error(result.error || "فشل التحديث");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCommunication = async () => {
    if (!commNotes.trim()) {
      toast.error("يرجى كتابة ملاحظات المحادثة");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await addCommunication({
        leadId: lead.id,
        notes: commNotes,
        channel: commChannel as "call" | "whatsapp" | "visit" | "other" | undefined,
        outcome: commOutcome || undefined,
        nextAction: commNextAction || undefined,
      });

      if (result.success) {
        toast.success("تم إضافة المحادثة");
        setShowCommDialog(false);
        setCommNotes("");
        setCommChannel("");
        setCommOutcome("");
        setCommNextAction("");
        router.refresh();
      } else {
        toast.error(result.error || "فشل الإضافة");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConvert = async () => {
    setIsUpdating(true);
    try {
      const result = await convertLeadToStudent(lead.id, {
        name: lead.childName || lead.name,
        phone: lead.phone,
        ageGroup: convertAgeGroup,
        area: lead.area || undefined,
      });

      if (result.success && result.student) {
        toast.success("تم تحويل العميل إلى طالب");
        router.push(`/students/${result.student.id}`);
      } else {
        toast.error(result.error || "فشل التحويل");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetFollowup = async (date: string) => {
    setIsUpdating(true);
    try {
      const result = await updateLead({ id: lead.id, nextFollowup: date });
      if (result.success) {
        toast.success("تم تحديث موعد المتابعة");
        router.refresh();
      } else {
        toast.error(result.error || "فشل التحديث");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/crm">
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4 ml-1" />
            رجوع
          </Button>
        </Link>
      </div>

      {/* Lead Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{lead.name}</CardTitle>
              <CardDescription className="mt-1">
                {lead.childName && `الطفل: ${lead.childName}`}
                {lead.age && ` (${lead.age} سنة)`}
              </CardDescription>
            </div>
            <Badge className={`${statusConfig.color} text-white`}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">رقم الهاتف</span>
            <div className="flex items-center gap-2">
              <span dir="ltr">{lead.phone}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <a href={`https://wa.me/${lead.phone.replace(/^0/, '20')}`} target="_blank">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {lead.area && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">المنطقة</span>
              <span>{lead.area}</span>
            </div>
          )}

          {lead.source && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">المصدر</span>
              <span>{lead.source}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الإضافة</span>
            <span>{formatDate(lead.createdAt)}</span>
          </div>

          {/* Follow-up Date */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">موعد المتابعة</span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-40"
                value={lead.nextFollowup || ""}
                onChange={(e) => handleSetFollowup(e.target.value)}
                disabled={isUpdating}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">تغيير الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                size="sm"
                variant={lead.status === key ? "default" : "outline"}
                className={lead.status === key ? config.color : ""}
                onClick={() => handleStatusChange(key as LeadStatus)}
                disabled={isUpdating || lead.status === "converted"}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => setShowCommDialog(true)}
        >
          <MessageCircle className="h-5 w-5" />
          <span>إضافة محادثة</span>
        </Button>
        
        {lead.status !== "converted" ? (
          <Button
            className="h-auto py-4 flex-col gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => setShowConvertDialog(true)}
          >
            <UserPlus className="h-5 w-5" />
            <span>تحويل لطالب</span>
          </Button>
        ) : (
          <Link href={`/students/${lead.convertedToStudentId}`} className="flex-1">
            <Button
              variant="outline"
              className="h-auto w-full py-4 flex-col gap-2"
            >
              <UserPlus className="h-5 w-5" />
              <span>عرض الطالب</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Communications History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">سجل المحادثات</CardTitle>
        </CardHeader>
        <CardContent>
          {communications.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              لا يوجد محادثات مسجلة
            </p>
          ) : (
            <div className="space-y-3">
              {communications.map((comm) => (
                <div key={comm.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-muted-foreground">
                        {formatDate(comm.communicationDate)}
                      </span>
                    </div>
                    {comm.channel && (
                      <Badge variant="outline">
                        {CHANNEL_LABELS[comm.channel] || comm.channel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{comm.notes}</p>
                  {comm.outcome && (
                    <p className="text-sm text-muted-foreground">
                      النتيجة: {comm.outcome}
                    </p>
                  )}
                  {comm.nextAction && (
                    <p className="text-sm text-amber-600">
                      الخطوة التالية: {comm.nextAction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Communication Dialog */}
      <Dialog open={showCommDialog} onOpenChange={setShowCommDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة محادثة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>طريقة التواصل</Label>
              <Select value={commChannel} onValueChange={setCommChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">اتصال</SelectItem>
                  <SelectItem value="whatsapp">واتساب</SelectItem>
                  <SelectItem value="visit">زيارة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات المحادثة *</Label>
              <Textarea
                value={commNotes}
                onChange={(e) => setCommNotes(e.target.value)}
                placeholder="ما تم مناقشته..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>النتيجة</Label>
              <Input
                value={commOutcome}
                onChange={(e) => setCommOutcome(e.target.value)}
                placeholder="مهتم، سيفكر، طلب معلومات..."
              />
            </div>
            <div className="space-y-2">
              <Label>الخطوة التالية</Label>
              <Input
                value={commNextAction}
                onChange={(e) => setCommNextAction(e.target.value)}
                placeholder="إعادة الاتصال، إرسال عرض..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCommDialog(false)} className="flex-1">
              إلغاء
            </Button>
            <Button onClick={handleAddCommunication} disabled={isUpdating} className="flex-1">
              {isUpdating ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Student Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تحويل إلى طالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              سيتم إنشاء طالب جديد باسم {lead.childName || lead.name}
            </p>
            <div className="space-y-2">
              <Label>الفئة العمرية</Label>
              <Select value={convertAgeGroup} onValueChange={(v) => setConvertAgeGroup(v as typeof convertAgeGroup)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-10">٥-١٠ سنوات</SelectItem>
                  <SelectItem value="10-15">١٠-١٥ سنة</SelectItem>
                  <SelectItem value="15+">١٥+ سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConvertDialog(false)} className="flex-1">
              إلغاء
            </Button>
            <Button 
              onClick={handleConvert} 
              disabled={isUpdating} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "جاري التحويل..." : "تحويل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
