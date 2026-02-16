"use server";

import { db } from "@/db";
import { students, payments, paymentCoverage, feeConfigs, attendance, trainingSessions, leads } from "@/db/schema";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";
import { getBillingInfo } from "@/lib/billing";

function getMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const months: Record<string, string> = {
    "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
    "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
    "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
  };
  return `${months[month] || month} ${year}`;
}

export interface ReportsData {
  // Student stats
  studentsByStatus: { status: string; count: number; label: string }[];
  studentsByAgeGroup: { ageGroup: string; count: number }[];
  totalStudents: number;
  
  // Revenue stats
  monthlyRevenue: { yearMonth: string; label: string; collected: number; expected: number; rate: number }[];
  currentMonthRevenue: { collected: number; expected: number; rate: number };
  totalCollectedAllTime: number;
  
  // Payment breakdown
  paymentsByMethod: { method: string; label: string; count: number; total: number }[];
  paymentsByType: { type: string; label: string; count: number; total: number }[];
  
  // Attendance stats
  attendanceOverall: { present: number; absent: number; excused: number; total: number; rate: number };
  sessionCount: number;
  
  // Leads stats
  leadsByStatus: { status: string; label: string; count: number }[];
  conversionRate: number;

  // Top overdue
  overdueStudents: { id: string; name: string; amount: number }[];
}

export async function getReportsData(): Promise<{ success: boolean; data?: ReportsData; error?: string }> {
  try {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Fetch all data in parallel
    const [
      allStudents,
      allPayments,
      allCoverage,
      allFeeConfigs,
      allAttendance,
      allSessions,
      allLeads,
    ] = await Promise.all([
      db.select().from(students),
      db.select().from(payments).orderBy(desc(payments.paymentDate)),
      db.select().from(paymentCoverage),
      db.select().from(feeConfigs),
      db.select().from(attendance),
      db.select().from(trainingSessions),
      db.select().from(leads),
    ]);

    // === STUDENT STATS ===
    const statusMap: Record<string, string> = {
      active: "نشط",
      inactive: "غير نشط",
      frozen: "مجمد",
      trial: "تجريبي",
    };
    const statusCounts: Record<string, number> = {};
    for (const s of allStudents) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    }
    const studentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      label: statusMap[status] || status,
    }));

    const ageGroupCounts: Record<string, number> = {};
    for (const s of allStudents) {
      const ag = s.ageGroup || "غير محدد";
      ageGroupCounts[ag] = (ageGroupCounts[ag] || 0) + 1;
    }
    const studentsByAgeGroup = Object.entries(ageGroupCounts).map(([ageGroup, count]) => ({
      ageGroup,
      count,
    }));

    // === REVENUE STATS ===
    // Get last 6 months coverage data
    const monthlyRevenue: ReportsData["monthlyRevenue"] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = getMonthName(ym);

      const monthCoverage = allCoverage.filter(c => c.yearMonth === ym && c.feeType === "monthly");
      const collected = monthCoverage.reduce((sum, c) => sum + parseFloat(c.amountPaid), 0);
      const expected = monthCoverage.reduce((sum, c) => sum + parseFloat(c.amountDue), 0);

      // If no coverage data, estimate expected from fee configs of active students
      let finalExpected = expected;
      if (expected === 0 && ym === currentYearMonth) {
        const activeStudentIds = allStudents.filter(s => s.status === "active").map(s => s.id);
        finalExpected = allFeeConfigs
          .filter(fc => activeStudentIds.includes(fc.studentId))
          .reduce((sum, fc) => sum + parseFloat(fc.monthlyFee), 0);
      }

      const rate = finalExpected > 0 ? Math.round((collected / finalExpected) * 100) : 0;
      monthlyRevenue.push({ yearMonth: ym, label, collected, expected: finalExpected, rate });
    }

    const currentMonth = monthlyRevenue[monthlyRevenue.length - 1] || { collected: 0, expected: 0, rate: 0 };
    const totalCollectedAllTime = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // === PAYMENT BREAKDOWN ===
    const methodMap: Record<string, string> = { cash: "نقدي", bank_transfer: "تحويل بنكي" };
    const typeMap: Record<string, string> = { monthly: "اشتراك شهري", bus: "رسوم باص", uniform: "زي رسمي" };

    const byMethod: Record<string, { count: number; total: number }> = {};
    const byType: Record<string, { count: number; total: number }> = {};
    for (const p of allPayments) {
      const m = p.paymentMethod;
      if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
      byMethod[m].count++;
      byMethod[m].total += parseFloat(p.amount);

      const t = p.paymentType;
      if (!byType[t]) byType[t] = { count: 0, total: 0 };
      byType[t].count++;
      byType[t].total += parseFloat(p.amount);
    }
    const paymentsByMethod = Object.entries(byMethod).map(([method, data]) => ({
      method, label: methodMap[method] || method, ...data,
    }));
    const paymentsByType = Object.entries(byType).map(([type, data]) => ({
      type, label: typeMap[type] || type, ...data,
    }));

    // === ATTENDANCE STATS ===
    const present = allAttendance.filter(a => a.status === "present").length;
    const absent = allAttendance.filter(a => a.status === "absent").length;
    const excused = allAttendance.filter(a => a.status === "excused").length;
    const totalAtt = allAttendance.length;
    const attRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0;

    // === LEADS STATS ===
    const leadStatusMap: Record<string, string> = {
      new: "جديد", contacted: "تم التواصل", interested: "مهتم",
      trial_scheduled: "تجربة محددة", trial_completed: "تجربة مكتملة",
      converted: "تم التحويل", not_interested: "غير مهتم",
      waiting_other_area: "منطقة أخرى",
    };
    const leadCounts: Record<string, number> = {};
    for (const l of allLeads) {
      leadCounts[l.status] = (leadCounts[l.status] || 0) + 1;
    }
    const leadsByStatus = Object.entries(leadCounts).map(([status, count]) => ({
      status, label: leadStatusMap[status] || status, count,
    }));
    const converted = allLeads.filter(l => l.status === "converted").length;
    const conversionRate = allLeads.length > 0 ? Math.round((converted / allLeads.length) * 100) : 0;

    // === OVERDUE STUDENTS ===
    const overdueStudents: ReportsData["overdueStudents"] = [];
    for (const student of allStudents.filter(s => s.status === "active")) {
      const fc = allFeeConfigs.find(f => f.studentId === student.id);
      if (!fc) continue;
      
      // Use registration-based billing cycle
      const billing = getBillingInfo(student.registrationDate);
      const coverage = allCoverage.find(
        c => c.studentId === student.id && c.yearMonth === billing.currentDueYearMonth && c.feeType === "monthly"
      );
      if (!coverage || coverage.status === "overdue" || coverage.status === "pending") {
        overdueStudents.push({
          id: student.id,
          name: student.name,
          amount: parseFloat(fc.monthlyFee),
        });
      } else if (coverage.status === "partial") {
        overdueStudents.push({
          id: student.id,
          name: student.name,
          amount: parseFloat(fc.monthlyFee) - parseFloat(coverage.amountPaid),
        });
      }
    }
    overdueStudents.sort((a, b) => b.amount - a.amount);

    return {
      success: true,
      data: {
        studentsByStatus,
        studentsByAgeGroup,
        totalStudents: allStudents.length,
        monthlyRevenue,
        currentMonthRevenue: { collected: currentMonth.collected, expected: currentMonth.expected, rate: currentMonth.rate },
        totalCollectedAllTime,
        paymentsByMethod,
        paymentsByType,
        attendanceOverall: { present, absent, excused, total: totalAtt, rate: attRate },
        sessionCount: allSessions.length,
        leadsByStatus,
        conversionRate,
        overdueStudents: overdueStudents.slice(0, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { success: false, error: "فشل في تحميل بيانات التقارير" };
  }
}
