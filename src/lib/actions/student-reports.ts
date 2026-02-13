"use server";

import { db } from "@/db";
import { students, evaluations, parentEvaluations, attendance, trainingSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const MONTH_NAMES: Record<number, string> = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
};

export interface MonthlyRecord {
  month: number;
  year: number;
  label: string;
  coach: {
    grandTotal: number;
    ballControl: number;
    passing: number;
    shooting: number;
    speed: number;
    fitness: number;
    positioning: number;
    gameAwareness: number;
    commitment: number;
    teamwork: number;
    discipline: number;
    technicalTotal: number;
    physicalTotal: number;
    tacticalTotal: number;
    attitudeTotal: number;
    notes: string | null;
  } | null;
  parent: {
    grandTotal: number;
    disciplineTotal: number;
    moralsTotal: number;
    homeTotal: number;
    prayer: number | null;
    sleep: number | null;
    healthyEating: number | null;
    respectOthers: number | null;
    angerControl: number | null;
    prepareBag: number | null;
    organizePersonal: number | null;
    fulfillRequests: number | null;
    parentNotes: string | null;
  } | null;
  combined: number; // /100
  attendance: {
    present: number;
    absent: number;
    excused: number;
    total: number;
    rate: number;
  } | null;
}

export interface StudentReportSummary {
  id: string;
  name: string;
  ageGroup: string | null;
  monthCount: number;
  avgCoach: number;
  avgParent: number;
  avgCombined: number;
  lastCoach: number | null;
  lastParent: number | null;
  trend: "up" | "down" | "stable" | "none";
  attendanceRate: number;
  attendancePresent: number;
  attendanceTotal: number;
}

// Get all students overview
export async function getStudentsReportOverview() {
  try {
    const activeStudents = await db
      .select({ id: students.id, name: students.name, ageGroup: students.ageGroup })
      .from(students)
      .where(eq(students.status, "active"))
      .orderBy(students.name);

    const allCoachEvals = await db.select().from(evaluations);
    const allParentEvals = await db
      .select()
      .from(parentEvaluations)
      .where(eq(parentEvaluations.isSubmitted, true));

    // Attendance data
    const allAttendance = await db.select().from(attendance);
    const attByStudent = new Map<string, { present: number; total: number }>();
    for (const a of allAttendance) {
      if (!attByStudent.has(a.studentId)) attByStudent.set(a.studentId, { present: 0, total: 0 });
      const entry = attByStudent.get(a.studentId)!;
      entry.total++;
      if (a.status === "present") entry.present++;
    }

    const coachByStudent = new Map<string, typeof allCoachEvals>();
    for (const e of allCoachEvals) {
      if (!coachByStudent.has(e.studentId)) coachByStudent.set(e.studentId, []);
      coachByStudent.get(e.studentId)!.push(e);
    }

    const parentByStudent = new Map<string, typeof allParentEvals>();
    for (const e of allParentEvals) {
      if (!parentByStudent.has(e.studentId)) parentByStudent.set(e.studentId, []);
      parentByStudent.get(e.studentId)!.push(e);
    }

    const summaries: StudentReportSummary[] = activeStudents.map((s) => {
      const coachEvals = coachByStudent.get(s.id) || [];
      const parentEvals = parentByStudent.get(s.id) || [];

      // Collect all months with any data
      const monthKeys = new Set<string>();
      coachEvals.forEach((e) => monthKeys.add(`${e.year}-${e.month}`));
      parentEvals.forEach((e) => monthKeys.add(`${e.year}-${e.month}`));

      const avgCoach = coachEvals.length > 0
        ? Math.round(coachEvals.reduce((sum, e) => sum + e.grandTotal, 0) / coachEvals.length * 10) / 10
        : 0;
      const avgParent = parentEvals.length > 0
        ? Math.round(parentEvals.reduce((sum, e) => sum + (e.grandTotal || 0), 0) / parentEvals.length * 10) / 10
        : 0;

      // Sort to get last two
      const sortedCoach = [...coachEvals].sort((a, b) => b.year - a.year || b.month - a.month);
      const sortedParent = [...parentEvals].sort((a, b) => b.year - a.year || b.month - a.month);

      const lastCoach = sortedCoach[0]?.grandTotal ?? null;
      const lastParent = sortedParent[0]?.grandTotal ?? null;

      // Trend: compare last 2 combined scores
      let trend: "up" | "down" | "stable" | "none" = "none";
      if (sortedCoach.length >= 2) {
        const curr = sortedCoach[0].grandTotal;
        const prev = sortedCoach[1].grandTotal;
        if (curr > prev) trend = "up";
        else if (curr < prev) trend = "down";
        else trend = "stable";
      }

      const att = attByStudent.get(s.id);
      const attendanceRate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;

      return {
        id: s.id,
        name: s.name,
        ageGroup: s.ageGroup,
        monthCount: monthKeys.size,
        avgCoach,
        avgParent,
        avgCombined: Math.round((avgCoach + avgParent) * 10) / 10,
        lastCoach,
        lastParent,
        trend,
        attendanceRate,
        attendancePresent: att?.present ?? 0,
        attendanceTotal: att?.total ?? 0,
      };
    });

    // Global averages
    const withData = summaries.filter((s) => s.avgCoach > 0 || s.avgParent > 0);
    const globalAvgCoach = withData.length > 0
      ? Math.round(withData.reduce((s, st) => s + st.avgCoach, 0) / withData.length * 10) / 10
      : 0;
    const globalAvgParent = withData.length > 0
      ? Math.round(withData.reduce((s, st) => s + st.avgParent, 0) / withData.length * 10) / 10
      : 0;

    const withAttendance = summaries.filter((s) => s.attendanceTotal > 0);
    const globalAttendanceRate = withAttendance.length > 0
      ? Math.round(withAttendance.reduce((s, st) => s + st.attendanceRate, 0) / withAttendance.length)
      : 0;

    return {
      success: true,
      students: summaries,
      totals: {
        totalStudents: activeStudents.length,
        evaluatedStudents: withData.length,
        globalAvgCoach,
        globalAvgParent,
        globalAvgCombined: Math.round((globalAvgCoach + globalAvgParent) * 10) / 10,
        globalAttendanceRate,
      },
    };
  } catch (error) {
    console.error("Error fetching student report overview:", error);
    return { success: false, error: "فشل في تحميل بيانات التقارير" };
  }
}

// Get detailed monthly report for a specific student
export async function getStudentDetailReport(studentId: string) {
  try {
    const [student] = await db
      .select({ id: students.id, name: students.name, ageGroup: students.ageGroup })
      .from(students)
      .where(eq(students.id, studentId));

    if (!student) return { success: false, error: "اللاعب غير موجود" };

    // Attendance data: get all sessions this student could attend + their records
    const studentAttendance = await db
      .select({
        status: attendance.status,
        sessionDate: trainingSessions.sessionDate,
      })
      .from(attendance)
      .innerJoin(trainingSessions, eq(attendance.sessionId, trainingSessions.id))
      .where(eq(attendance.studentId, studentId));

    // Group attendance by month
    const attByMonth = new Map<string, { present: number; absent: number; excused: number; total: number }>();
    for (const a of studentAttendance) {
      const d = new Date(a.sessionDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!attByMonth.has(key)) attByMonth.set(key, { present: 0, absent: 0, excused: 0, total: 0 });
      const entry = attByMonth.get(key)!;
      entry.total++;
      if (a.status === "present") entry.present++;
      else if (a.status === "absent") entry.absent++;
      else if (a.status === "excused") entry.excused++;
    }

    // Overall attendance
    const totalPresent = studentAttendance.filter((a) => a.status === "present").length;
    const totalAbsent = studentAttendance.filter((a) => a.status === "absent").length;
    const totalExcused = studentAttendance.filter((a) => a.status === "excused").length;
    const totalAtt = studentAttendance.length;
    const overallAttRate = totalAtt > 0 ? Math.round((totalPresent / totalAtt) * 100) : 0;

    const coachEvals = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.studentId, studentId))
      .orderBy(desc(evaluations.year), desc(evaluations.month));

    const parentEvals = await db
      .select()
      .from(parentEvaluations)
      .where(
        and(
          eq(parentEvaluations.studentId, studentId),
          eq(parentEvaluations.isSubmitted, true)
        )
      );

    // Merge by month
    const monthMap = new Map<string, MonthlyRecord>();

    for (const e of coachEvals) {
      const key = `${e.year}-${e.month}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month: e.month,
          year: e.year,
          label: `${MONTH_NAMES[e.month]} ${e.year}`,
          coach: null,
          parent: null,
          combined: 0,
          attendance: null,
        });
      }
      const rec = monthMap.get(key)!;
      rec.coach = {
        grandTotal: e.grandTotal,
        ballControl: e.ballControl,
        passing: e.passing,
        shooting: e.shooting,
        speed: e.speed,
        fitness: e.fitness,
        positioning: e.positioning,
        gameAwareness: e.gameAwareness,
        commitment: e.commitment,
        teamwork: e.teamwork,
        discipline: e.discipline,
        technicalTotal: e.ballControl + e.passing + e.shooting,
        physicalTotal: e.speed + e.fitness,
        tacticalTotal: e.positioning + e.gameAwareness,
        attitudeTotal: e.commitment + e.teamwork + e.discipline,
        notes: e.notes,
      };
    }

    for (const e of parentEvals) {
      const key = `${e.year}-${e.month}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month: e.month,
          year: e.year,
          label: `${MONTH_NAMES[e.month]} ${e.year}`,
          coach: null,
          parent: null,
          combined: 0,
          attendance: null,
        });
      }
      const rec = monthMap.get(key)!;
      rec.parent = {
        grandTotal: e.grandTotal || 0,
        disciplineTotal: e.disciplineTotal || 0,
        moralsTotal: e.moralsTotal || 0,
        homeTotal: e.homeTotal || 0,
        prayer: e.prayer,
        sleep: e.sleep,
        healthyEating: e.healthyEating,
        respectOthers: e.respectOthers,
        angerControl: e.angerControl,
        prepareBag: e.prepareBag,
        organizePersonal: e.organizePersonal,
        fulfillRequests: e.fulfillRequests,
        parentNotes: e.parentNotes,
      };
    }

    // Merge attendance into months & calculate combined
    for (const [key, att] of attByMonth.entries()) {
      if (!monthMap.has(key)) {
        const [y, m] = key.split("-").map(Number);
        monthMap.set(key, {
          month: m,
          year: y,
          label: `${MONTH_NAMES[m]} ${y}`,
          coach: null,
          parent: null,
          combined: 0,
          attendance: null,
        });
      }
    }

    for (const rec of monthMap.values()) {
      rec.combined = (rec.coach?.grandTotal || 0) + (rec.parent?.grandTotal || 0);
      const att = attByMonth.get(`${rec.year}-${rec.month}`);
      if (att && att.total > 0) {
        rec.attendance = {
          ...att,
          rate: Math.round((att.present / att.total) * 100),
        };
      } else {
        rec.attendance = null;
      }
    }

    // Sort by date descending
    const records = [...monthMap.values()].sort(
      (a, b) => b.year - a.year || b.month - a.month
    );

    // Averages
    const coachAvg = coachEvals.length > 0
      ? Math.round(coachEvals.reduce((s, e) => s + e.grandTotal, 0) / coachEvals.length * 10) / 10
      : 0;
    const parentTotal = parentEvals.filter((e) => e.grandTotal != null);
    const parentAvg = parentTotal.length > 0
      ? Math.round(parentTotal.reduce((s, e) => s + (e.grandTotal || 0), 0) / parentTotal.length * 10) / 10
      : 0;

    return {
      success: true,
      student,
      records,
      averages: {
        coach: coachAvg,
        parent: parentAvg,
        combined: Math.round((coachAvg + parentAvg) * 10) / 10,
      },
      attendanceSummary: {
        present: totalPresent,
        absent: totalAbsent,
        excused: totalExcused,
        total: totalAtt,
        rate: overallAttRate,
      },
    };
  } catch (error) {
    console.error("Error fetching student detail report:", error);
    return { success: false, error: "فشل في تحميل تقرير اللاعب" };
  }
}
