"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreateSessionDialog } from "./create-session-dialog";
import { SessionAttendance } from "./session-attendance";
import { createTrainingSession } from "@/lib/actions/attendance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Plus, Calendar, Users } from "lucide-react";

interface Session {
  id: string;
  sessionDate: string;
  ageGroup: string | null;
  notes: string | null;
  createdAt: Date;
}

interface AttendanceContentProps {
  sessions: Session[];
}

const AGE_GROUP_LABELS: Record<string, string> = {
  "5-10": "٥-١٠ سنوات",
  "10-15": "١٠-١٥ سنة",
  "15+": "١٥+ سنة",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

export function AttendanceContent({ sessions }: AttendanceContentProps) {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [quickStartLoading, setQuickStartLoading] = useState<string | null>(null);

  const todaySessions = sessions.filter((s) => isToday(s.sessionDate));
  const pastSessions = sessions.filter((s) => !isToday(s.sessionDate));

  // Quick start: create today's session for an age group and immediately open it
  const handleQuickStart = async (ageGroup: "5-10" | "10-15" | "15+") => {
    // Check if session already exists for today + this age group
    const existing = todaySessions.find((s) => s.ageGroup === ageGroup);
    if (existing) {
      setSelectedSession(existing);
      return;
    }

    setQuickStartLoading(ageGroup);
    try {
      const today = new Date().toISOString().split("T")[0];
      const result = await createTrainingSession({ date: today, ageGroup });
      if (result.success && result.session) {
        setSelectedSession(result.session);
        router.refresh();
      } else {
        toast.error(result.error || "فشل في إنشاء التدريب");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setQuickStartLoading(null);
    }
  };

  // Called when CreateSessionDialog succeeds — open attendance immediately
  const handleSessionCreated = (session: Session) => {
    setShowCreateDialog(false);
    setSelectedSession(session);
  };

  if (selectedSession) {
    return (
      <SessionAttendance
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">الحضور</h1>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 ml-1" />
          تدريب جديد
        </Button>
      </div>

      {/* Quick Start — prominent call to action */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            تسجيل حضور اليوم
          </CardTitle>
          <p className="text-xs text-zinc-500">اختر الفئة العمرية لبدء تسجيل الحضور فوراً</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(["5-10", "10-15", "15+"] as const).map((ag) => {
              const existsToday = todaySessions.some((s) => s.ageGroup === ag);
              return (
                <Button
                  key={ag}
                  variant={existsToday ? "default" : "outline"}
                  className={`h-auto flex-col gap-1 py-3 ${existsToday ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={() => handleQuickStart(ag)}
                  disabled={quickStartLoading === ag}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">{AGE_GROUP_LABELS[ag]}</span>
                  {existsToday && <span className="text-[10px] opacity-80">مسجّل ✓</span>}
                  {quickStartLoading === ag && <span className="text-[10px]">جاري...</span>}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-green-600">●</span>
              تدريبات اليوم ({todaySessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-right"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {session.ageGroup ? AGE_GROUP_LABELS[session.ageGroup] || session.ageGroup : "غير محدد"}
                  </Badge>
                  {session.notes && (
                    <span className="text-xs text-muted-foreground">{session.notes}</span>
                  )}
                </div>
                <span className="text-sm text-primary font-medium">
                  تسجيل الحضور ←
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Past Sessions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            التدريبات السابقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" dir="rtl">
            <TabsList className="w-full">
              <TabsTrigger value="recent" className="flex-1">آخر ١٠</TabsTrigger>
              <TabsTrigger value="all" className="flex-1">الكل ({pastSessions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-3 space-y-2">
              {pastSessions.slice(0, 10).map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-right"
                >
                  <div>
                    <p className="font-medium text-sm">{formatDate(session.sessionDate)}</p>
                    <Badge variant="outline" className="mt-1">
                      {session.ageGroup ? AGE_GROUP_LABELS[session.ageGroup] || session.ageGroup : "غير محدد"}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">عرض ←</span>
                </button>
              ))}
              {pastSessions.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">لا توجد تدريبات سابقة</p>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-3 space-y-2">
              {pastSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-right"
                >
                  <div>
                    <p className="font-medium text-sm">{formatDate(session.sessionDate)}</p>
                    <Badge variant="outline" className="mt-1">
                      {session.ageGroup ? AGE_GROUP_LABELS[session.ageGroup] || session.ageGroup : "غير محدد"}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">عرض ←</span>
                </button>
              ))}
              {pastSessions.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">لا توجد تدريبات سابقة</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
