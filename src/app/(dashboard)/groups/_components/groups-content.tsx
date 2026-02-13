"use client";

import type { GroupData, GroupStudent } from "@/lib/actions/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import {
  Users,
  CalendarCheck,
  Star,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-800" },
  inactive: { label: "غير نشط", color: "bg-zinc-100 text-zinc-600" },
  frozen: { label: "مجمد", color: "bg-blue-100 text-blue-800" },
  trial: { label: "تجريبي", color: "bg-amber-100 text-amber-800" },
};

function scorePct(val: number, max: number) {
  return max > 0 ? (val / max) * 100 : 0;
}

function scoreColor(pct: number): string {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-yellow-600";
  if (pct >= 40) return "text-orange-500";
  return "text-red-500";
}

function barColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-yellow-500";
  if (pct >= 40) return "bg-orange-500";
  return "bg-red-500";
}

// ===== Stat Mini Card =====
function StatBox({
  icon: Icon,
  label,
  value,
  subtext,
  iconBg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500">{label}</p>
        <p className="text-sm font-bold leading-tight">{value}</p>
        {subtext && <p className="text-[10px] text-zinc-400">{subtext}</p>}
      </div>
    </div>
  );
}

// ===== Group Card =====
function GroupCard({ group }: { group: GroupData }) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = group.students.filter((s) => s.name.includes(search));

  return (
    <Card className="overflow-hidden">
      {/* Group Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-lg text-white font-bold">
              {group.ageGroup === "5-10" ? "🟢" : group.ageGroup === "10-15" ? "🔵" : group.ageGroup === "15+" ? "🟡" : "⚪"}
            </div>
            <div>
              <CardTitle className="text-lg">{group.label}</CardTitle>
              <p className="text-xs text-zinc-500">
                {group.activeCount} نشط من {group.studentCount} لاعب
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1"
          >
            {expanded ? (
              <>
                إخفاء
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                عرض اللاعبين
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Stats Row */}
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox
            icon={Users}
            label="اللاعبين النشطين"
            value={group.activeCount}
            subtext={`من ${group.studentCount}`}
            iconBg="bg-blue-100 text-blue-600"
          />
          <StatBox
            icon={CalendarCheck}
            label="نسبة الحضور"
            value={`${group.attendanceRate}%`}
            iconBg="bg-emerald-100 text-emerald-600"
          />
          <StatBox
            icon={Star}
            label="معدل تقييم المدرب"
            value={group.avgCoachScore > 0 ? `${group.avgCoachScore}/50` : "—"}
            iconBg="bg-amber-100 text-amber-600"
          />
          <StatBox
            icon={DollarSign}
            label="نسبة التحصيل"
            value={`${group.paymentRate}%`}
            subtext="الشهر الحالي"
            iconBg="bg-violet-100 text-violet-600"
          />
        </div>

        {/* Progress bars */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">الحضور</span>
              <span className={scoreColor(group.attendanceRate)}>{group.attendanceRate}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${barColor(group.attendanceRate)}`}
                style={{ width: `${group.attendanceRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">التقييم</span>
              <span className={scoreColor(scorePct(group.avgCoachScore, 50))}>
                {group.avgCoachScore > 0 ? `${Math.round(scorePct(group.avgCoachScore, 50))}%` : "—"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${barColor(scorePct(group.avgCoachScore, 50))}`}
                style={{ width: `${scorePct(group.avgCoachScore, 50)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">التحصيل</span>
              <span className={scoreColor(group.paymentRate)}>{group.paymentRate}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${barColor(group.paymentRate)}`}
                style={{ width: `${group.paymentRate}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Expanded Student List */}
      {expanded && (
        <div className="border-t bg-zinc-50/50">
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="بحث في المجموعة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 bg-white pr-9 text-sm"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-zinc-500">
                  <th className="px-4 py-2 text-right text-xs font-medium">اللاعب</th>
                  <th className="px-4 py-2 text-center text-xs font-medium">الحالة</th>
                  <th className="px-4 py-2 text-center text-xs font-medium">الحضور</th>
                  <th className="px-4 py-2 text-center text-xs font-medium">تقييم المدرب</th>
                  <th className="w-16 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                      لا يوجد لاعبين
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const st = STATUS_MAP[s.status] || { label: s.status, color: "bg-zinc-100 text-zinc-600" };
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-white">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-zinc-900">{s.name}</p>
                          {s.membershipNumber && (
                            <p className="text-[10px] text-zinc-400">#{s.membershipNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant="secondary" className={`text-[10px] ${st.color}`}>
                            {st.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={scoreColor(s.attendanceRate)}>
                            {s.attendanceRate > 0 ? `${s.attendanceRate}%` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {s.coachScore !== null ? (
                            <span className={`font-medium ${scoreColor(scorePct(s.coachScore, 50))}`}>
                              {s.coachScore}/50
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Link href={`/students/${s.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

// ===== MAIN =====
interface GroupsContentProps {
  groups: GroupData[];
  error?: string;
}

export function GroupsContent({ groups, error }: GroupsContentProps) {
  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  const totalActive = groups.reduce((s, g) => s + g.activeCount, 0);
  const totalStudents = groups.reduce((s, g) => s + g.studentCount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">🏆 المجموعات</h1>
          <p className="text-sm text-zinc-500">
            {totalActive} لاعب نشط من {totalStudents} — مقسمين حسب الفئة العمرية
          </p>
        </div>
      </div>

      {/* Group Cards */}
      <div className="space-y-6">
        {groups.map((g) => (
          <GroupCard key={g.ageGroup} group={g} />
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">لا توجد مجموعات بعد. أضف لاعبين وحدد الفئات العمرية.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
