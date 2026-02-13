"use client";

import { useState, useEffect } from "react";
import { getStudentAttendance } from "@/lib/actions/attendance";
import { CheckCircle2, XCircle, AlertCircle, CalendarDays, TrendingUp } from "lucide-react";

interface AttendanceHistoryProps {
  studentId: string;
}

interface AttendanceRecord {
  attendance: {
    id: string;
    status: string;
    notes: string | null;
  };
  session: {
    id: string;
    sessionDate: string;
    ageGroup: string | null;
  };
}

interface AttendanceStats {
  present: number;
  absent: number;
  excused: number;
  total: number;
  attendanceRate: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string; dot: string }> = {
  present: {
    label: "حاضر",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  absent: {
    label: "غائب",
    icon: XCircle,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  excused: {
    label: "معذور",
    icon: AlertCircle,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "short",
  }).format(date);
}

export function AttendanceHistory({ studentId }: AttendanceHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    excused: 0,
    total: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    loadAttendance();
  }, [studentId]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const result = await getStudentAttendance(studentId);
      if (result.success) {
        setRecords(result.records as AttendanceRecord[]);
        setStats(result.stats);
      }
    } catch {
      console.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-500 font-medium">لا يوجد سجل حضور لهذا اللاعب</p>
      </div>
    );
  }

  const rateColor =
    stats.attendanceRate >= 80 ? "text-emerald-600" :
    stats.attendanceRate >= 60 ? "text-amber-600" : "text-rose-600";

  const rateBarColor =
    stats.attendanceRate >= 80 ? "bg-emerald-500" :
    stats.attendanceRate >= 60 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Present */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">حاضر</span>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{stats.present}</p>
          <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-emerald-100/50" />
        </div>

        {/* Absent */}
        <div className="relative overflow-hidden rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-medium text-rose-600">غائب</span>
          </div>
          <p className="text-3xl font-bold text-rose-700">{stats.absent}</p>
          <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-rose-100/50" />
        </div>

        {/* Excused */}
        <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600">معذور</span>
          </div>
          <p className="text-3xl font-bold text-amber-700">{stats.excused}</p>
          <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-amber-100/50" />
        </div>

        {/* Attendance Rate */}
        <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">نسبة الحضور</span>
          </div>
          <p className={`text-3xl font-bold ${rateColor}`}>{stats.attendanceRate}%</p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200">
            <div
              className={`h-1.5 rounded-full ${rateBarColor} transition-all`}
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
          <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-blue-100/50" />
        </div>
      </div>

      {/* Attendance Records */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm text-zinc-700">سجل التدريبات</h3>
          <span className="text-xs text-zinc-400">آخر {records.length} تدريب</span>
        </div>

        <div className="space-y-1.5">
          {records.map((record) => {
            const config = STATUS_CONFIG[record.attendance.status] || STATUS_CONFIG.present;
            const Icon = config.icon;

            return (
              <div
                key={record.attendance.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${config.border} ${config.bg} transition-all hover:shadow-sm`}
              >
                {/* Date column */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-zinc-200 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-medium text-zinc-400 leading-none">{formatWeekday(record.session.sessionDate)}</span>
                    <span className="text-lg font-bold text-zinc-800 leading-tight">{new Date(record.session.sessionDate).getDate()}</span>
                    <span className="text-[10px] text-zinc-400 leading-none">{formatDateShort(record.session.sessionDate).split(" ")[1] || ""}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800">
                      {formatDateFull(record.session.sessionDate)}
                    </p>
                    {record.attendance.notes && (
                      <p className="text-xs text-zinc-500 truncate">{record.attendance.notes}</p>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border ${config.border} shadow-sm`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
