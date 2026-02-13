"use server";

import { db } from "@/db";
import {
  students,
  attendance,
  trainingSessions,
  evaluations,
  paymentCoverage,
  feeConfigs,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const AGE_GROUP_LABELS: Record<string, string> = {
  "5-10": "٥ - ١٠ سنوات",
  "10-15": "١٠ - ١٥ سنة",
  "15+": "+١٥ سنة",
};

export interface GroupStudent {
  id: string;
  name: string;
  membershipNumber: string | null;
  status: string;
  attendanceRate: number;
  coachScore: number | null; // latest grand total /50
}

export interface GroupData {
  ageGroup: string;
  label: string;
  studentCount: number;
  activeCount: number;
  attendanceRate: number;
  avgCoachScore: number;
  paymentRate: number;
  students: GroupStudent[];
}

export async function getGroupsData(): Promise<{
  success: boolean;
  groups?: GroupData[];
  error?: string;
}> {
  try {
    // Fetch all needed data in parallel
    const [allStudents, allAttendance, allSessions, allEvaluations, allCoverage, allFeeConfigs] =
      await Promise.all([
        db.select().from(students),
        db.select().from(attendance),
        db.select().from(trainingSessions),
        db.select().from(evaluations),
        db.select().from(paymentCoverage),
        db.select().from(feeConfigs),
      ]);

    // Current month for payment status
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Group students by age group
    const ageGroups = ["5-10", "10-15", "15+"];
    const groups: GroupData[] = [];

    for (const ag of ageGroups) {
      const groupStudents = allStudents.filter((s) => s.ageGroup === ag);
      const activeStudents = groupStudents.filter((s) => s.status === "active");
      const studentIds = new Set(groupStudents.map((s) => s.id));

      // Attendance: sessions for this age group
      const groupSessions = allSessions.filter((s) => s.ageGroup === ag);
      const sessionIds = new Set(groupSessions.map((s) => s.id));
      const groupAttendance = allAttendance.filter(
        (a) => sessionIds.has(a.sessionId) && studentIds.has(a.studentId)
      );
      const presentCount = groupAttendance.filter((a) => a.status === "present").length;
      const totalAttendance = groupAttendance.length;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      // Per-student attendance map
      const studentAttMap = new Map<string, { present: number; total: number }>();
      for (const a of groupAttendance) {
        if (!studentAttMap.has(a.studentId)) studentAttMap.set(a.studentId, { present: 0, total: 0 });
        const entry = studentAttMap.get(a.studentId)!;
        entry.total++;
        if (a.status === "present") entry.present++;
      }

      // Latest coach evaluations per student
      const studentLatestEval = new Map<string, number>();
      for (const e of allEvaluations) {
        if (!studentIds.has(e.studentId)) continue;
        const existing = studentLatestEval.get(e.studentId);
        // Just use grandTotal — we'll pick the latest by year/month
        if (existing === undefined) {
          studentLatestEval.set(e.studentId, e.grandTotal);
        } else {
          // We need to compare dates — store all and sort after
        }
      }
      // Actually let's be more precise
      const studentEvalsByDate = new Map<string, { year: number; month: number; grandTotal: number }[]>();
      for (const e of allEvaluations) {
        if (!studentIds.has(e.studentId)) continue;
        if (!studentEvalsByDate.has(e.studentId)) studentEvalsByDate.set(e.studentId, []);
        studentEvalsByDate.get(e.studentId)!.push({ year: e.year, month: e.month, grandTotal: e.grandTotal });
      }
      const latestEvalMap = new Map<string, number>();
      for (const [sid, evals] of studentEvalsByDate.entries()) {
        evals.sort((a, b) => b.year - a.year || b.month - a.month);
        latestEvalMap.set(sid, evals[0].grandTotal);
      }

      // Average coach score for group
      const scoresArr = [...latestEvalMap.values()];
      const avgCoachScore =
        scoresArr.length > 0
          ? Math.round((scoresArr.reduce((s, v) => s + v, 0) / scoresArr.length) * 10) / 10
          : 0;

      // Payment rate: active students with paid status for current month
      const activeIds = new Set(activeStudents.map((s) => s.id));
      const monthCoverage = allCoverage.filter(
        (c) => activeIds.has(c.studentId) && c.yearMonth === currentYearMonth && c.feeType === "monthly"
      );
      const paidCount = monthCoverage.filter((c) => c.status === "paid").length;
      const paymentRate = activeStudents.length > 0 ? Math.round((paidCount / activeStudents.length) * 100) : 0;

      // Build student list
      const studentsData: GroupStudent[] = groupStudents.map((s) => {
        const att = studentAttMap.get(s.id);
        const attRate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
        return {
          id: s.id,
          name: s.name,
          membershipNumber: s.membershipNumber,
          status: s.status,
          attendanceRate: attRate,
          coachScore: latestEvalMap.get(s.id) ?? null,
        };
      });

      // Sort: active first, then by name
      studentsData.sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return a.name.localeCompare(b.name, "ar");
      });

      groups.push({
        ageGroup: ag,
        label: AGE_GROUP_LABELS[ag] || ag,
        studentCount: groupStudents.length,
        activeCount: activeStudents.length,
        attendanceRate,
        avgCoachScore,
        paymentRate,
        students: studentsData,
      });
    }

    // Also include un-grouped students
    const ungrouped = allStudents.filter((s) => !s.ageGroup || !ageGroups.includes(s.ageGroup));
    if (ungrouped.length > 0) {
      groups.push({
        ageGroup: "none",
        label: "غير مصنفين",
        studentCount: ungrouped.length,
        activeCount: ungrouped.filter((s) => s.status === "active").length,
        attendanceRate: 0,
        avgCoachScore: 0,
        paymentRate: 0,
        students: ungrouped.map((s) => ({
          id: s.id,
          name: s.name,
          membershipNumber: s.membershipNumber,
          status: s.status,
          attendanceRate: 0,
          coachScore: null,
        })),
      });
    }

    return { success: true, groups };
  } catch (error) {
    console.error("Error fetching groups data:", error);
    return { success: false, error: "فشل في تحميل بيانات المجموعات" };
  }
}
