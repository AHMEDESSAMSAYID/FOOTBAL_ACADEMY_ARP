"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getSessionAttendance, batchMarkAttendance, markAttendance } from "@/lib/actions/attendance";
import { sendAttendanceSms } from "@/lib/actions/notifications";
import { toast } from "sonner";
import { Search, CheckCheck, XCircle, ArrowRight, MessageSquare } from "lucide-react";

interface Session {
  id: string;
  sessionDate: string;
  ageGroup: string | null;
  notes: string | null;
}

interface Student {
  id: string;
  name: string;
  status: string | null;
  phone: string | null;
}

interface AttendanceRecord {
  attendance: {
    id: string;
    status: string;
    notes: string | null;
  };
  student: Student;
}

interface SessionAttendanceProps {
  session: Session;
  onBack: () => void;
}

const AGE_GROUP_LABELS: Record<string, string> = {
  "5-10": "٥-١٠ سنوات",
  "10-15": "١٠-١٥ سنة",
  "15+": "١٥+ سنة",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  present: { label: "حاضر", color: "bg-green-500" },
  absent: { label: "غائب", color: "bg-red-500" },
  excused: { label: "معذور", color: "bg-yellow-500" },
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

export function SessionAttendance({ session, onBack }: SessionAttendanceProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sendingSms, setSendingSms] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [session.id]);

  const loadSessionData = async () => {
    setLoading(true);
    try {
      const result = await getSessionAttendance(session.id);
      if (result.success) {
        setStudents(result.ageGroupStudents || []);
        
        const map: Record<string, string> = {};
        (result.attendanceRecords || []).forEach((record: AttendanceRecord) => {
          map[record.student.id] = record.attendance.status;
        });
        setAttendanceMap(map);
      }
    } catch {
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (
    studentId: string,
    status: "present" | "absent" | "excused"
  ) => {
    setSaving(studentId);
    try {
      const result = await markAttendance({
        sessionId: session.id,
        studentId,
        status,
      });

      if (result.success) {
        setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
      } else {
        toast.error(result.error || "فشل في تسجيل الحضور");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSaving(null);
    }
  };

  const handleMarkAll = async (status: "present" | "absent") => {
    // Only mark students that haven't been marked yet
    const unmarked = students.filter((s) => !attendanceMap[s.id]);
    if (unmarked.length === 0) {
      toast.info("جميع الطلاب تم تسجيلهم بالفعل");
      return;
    }

    setBulkSaving(true);
    try {
      const records = unmarked.map((s) => ({
        studentId: s.id,
        status,
      }));

      const result = await batchMarkAttendance({
        sessionId: session.id,
        records,
      });

      if (result.success) {
        const newMap = { ...attendanceMap };
        unmarked.forEach((s) => { newMap[s.id] = status; });
        setAttendanceMap(newMap);
        toast.success(`تم تسجيل ${unmarked.length} طالب كـ ${status === "present" ? "حاضر" : "غائب"}`);
      } else {
        toast.error(result.error || "فشل في التسجيل الجماعي");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSendSms = async (studentId: string, studentName: string) => {
    const status = attendanceMap[studentId] as "present" | "absent" | "excused";
    if (!status) {
      toast.error("يرجى تسجيل الحضور أولاً");
      return;
    }
    setSendingSms(studentId);
    try {
      const result = await sendAttendanceSms(studentId, studentName, status);
      if (result.success) {
        toast.success("تم إرسال الإشعار لولي الأمر");
      } else {
        toast.error(result.error || "فشل في إرسال الإشعار");
      }
    } catch {
      toast.error("فشل في إرسال الإشعار");
    } finally {
      setSendingSms(null);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    return students.filter((s) => s.name.includes(search));
  }, [students, search]);

  const presentCount = Object.values(attendanceMap).filter((s) => s === "present").length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === "absent").length;
  const excusedCount = Object.values(attendanceMap).filter((s) => s === "excused").length;
  const unmarkedCount = students.length - Object.keys(attendanceMap).length;

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowRight className="h-4 w-4 ml-1" />
            رجوع
          </Button>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowRight className="h-4 w-4 ml-1" />
          رجوع
        </Button>
        <h1 className="text-lg font-bold">تسجيل الحضور</h1>
      </div>

      {/* Session Info */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{formatDate(session.sessionDate)}</p>
              <Badge variant="secondary" className="mt-1">
                {session.ageGroup ? AGE_GROUP_LABELS[session.ageGroup] || session.ageGroup : "غير محدد"}
              </Badge>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-muted-foreground">حاضر</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="p-2 rounded-lg bg-green-50">
          <p className="text-lg font-bold text-green-600">{presentCount}</p>
          <p className="text-xs text-muted-foreground">حاضر</p>
        </div>
        <div className="p-2 rounded-lg bg-red-50">
          <p className="text-lg font-bold text-red-600">{absentCount}</p>
          <p className="text-xs text-muted-foreground">غائب</p>
        </div>
        <div className="p-2 rounded-lg bg-yellow-50">
          <p className="text-lg font-bold text-yellow-600">{excusedCount}</p>
          <p className="text-xs text-muted-foreground">معذور</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-50">
          <p className="text-lg font-bold">{unmarkedCount}</p>
          <p className="text-xs text-muted-foreground">غير مسجل</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {unmarkedCount > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => handleMarkAll("present")}
            disabled={bulkSaving}
          >
            <CheckCheck className="h-4 w-4" />
            تحضير الكل ({unmarkedCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleMarkAll("absent")}
            disabled={bulkSaving}
          >
            <XCircle className="h-4 w-4" />
            تغييب الكل ({unmarkedCount})
          </Button>
        </div>
      )}

      {/* Search */}
      {students.length > 5 && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="ابحث عن طالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
      )}

      {/* Student List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            الطلاب ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {students.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>لا يوجد طلاب في هذه الفئة العمرية</p>
              <p className="text-xs mt-1">تأكد من تعيين الفئة العمرية للاعبين من صفحة اللاعبين</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">لا يوجد نتائج</p>
          ) : (
            filteredStudents.map((student) => {
              const currentStatus = attendanceMap[student.id];
              const isBlocked = student.status === "frozen";

              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isBlocked ? "border-red-300 bg-red-50" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium flex items-center gap-2 truncate">
                      {student.name}
                      {isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          مجمد
                        </Badge>
                      )}
                    </p>
                    {currentStatus && (
                      <Badge
                        className={`mt-1 ${
                          STATUS_CONFIG[currentStatus]?.color
                        } text-white`}
                      >
                        {STATUS_CONFIG[currentStatus]?.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 mr-2">
                    <Button
                      size="sm"
                      variant={currentStatus === "present" ? "default" : "outline"}
                      className={
                        currentStatus === "present"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                      onClick={() => handleMarkAttendance(student.id, "present")}
                      disabled={saving === student.id || bulkSaving}
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant={currentStatus === "absent" ? "default" : "outline"}
                      className={
                        currentStatus === "absent"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                      onClick={() => handleMarkAttendance(student.id, "absent")}
                      disabled={saving === student.id || bulkSaving}
                    >
                      ✗
                    </Button>
                    <Button
                      size="sm"
                      variant={currentStatus === "excused" ? "default" : "outline"}
                      className={
                        currentStatus === "excused"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : ""
                      }
                      onClick={() => handleMarkAttendance(student.id, "excused")}
                      disabled={saving === student.id || bulkSaving}
                    >
                      ع
                    </Button>
                    {currentStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleSendSms(student.id, student.name)}
                        disabled={sendingSms === student.id}
                        title="إرسال SMS لولي الأمر"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {session.notes && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">
              <strong>ملاحظات:</strong> {session.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
