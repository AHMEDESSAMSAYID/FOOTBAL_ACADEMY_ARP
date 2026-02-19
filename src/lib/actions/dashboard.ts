"use server";

import { db } from "@/db";
import { students, payments, paymentCoverage, feeConfigs, leads, contacts } from "@/db/schema";
import { eq, sql, and, count, desc } from "drizzle-orm";

export interface DashboardStats {
  // Student counts
  totalStudents: number;
  activeStudents: number;
  trialStudents: number;
  frozenStudents: number;
  
  // Payment stats
  paidCount: number;
  partialCount: number;
  overdueCount: number;
  
  // Collection metrics
  expectedRevenue: number;
  collectedRevenue: number;
  collectionRate: number;
  
  // Leads
  totalLeads: number;
  newLeads: number;

  // Selected month label (for display)
  selectedMonth: string | null;
  
  // Attention items
  needsAttention: {
    studentId: string;
    studentName: string;
    type: "blocked" | "overdue" | "partial";
    amount?: number;
    daysOverdue?: number;
    coveredUntil?: string;
    phone?: string;
  }[];
}

/**
 * @param yearMonth Optional YYYY-MM override for revenue view.
 *                  Overdue detection always uses real dates (coverageEnd vs today).
 */
export async function getDashboardStats(yearMonth?: string): Promise<DashboardStats> {
  // Fetch all students
  const allStudents = await db.select().from(students);
  
  // Fetch all fee configs
  const allFeeConfigs = await db.select().from(feeConfigs);
  
  // Fetch ALL payments (for coverage end dates + revenue)
  const allPayments = await db.select().from(payments);
  
  // Fetch all contacts for phone numbers
  const allContacts = await db.select().from(contacts);
  
  // Fetch leads
  const allLeads = await db.select().from(leads);
  
  // Calculate student counts
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter(s => s.status === "active").length;
  const trialStudents = allStudents.filter(s => s.status === "trial").length;
  const frozenStudents = allStudents.filter(s => s.status === "frozen").length;
  
  // Only count active / trial students for payment stats
  const studentsWithConfig = allStudents.filter(s => {
    if (!allFeeConfigs.some(fc => fc.studentId === s.id)) return false;
    if (s.status !== "active" && s.status !== "trial") return false;
    return true;
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  
  let paidCount = 0;
  let partialCount = 0;
  let overdueCount = 0;
  let expectedRevenue = 0;
  
  const needsAttention: DashboardStats["needsAttention"] = [];
  
  for (const student of studentsWithConfig) {
    const feeConfig = allFeeConfigs.find(fc => fc.studentId === student.id);
    const primaryContact = allContacts.find(
      c => c.studentId === student.id && c.isPrimaryPayer
    ) || allContacts.find(c => c.studentId === student.id);
    
    const monthlyFee = parseFloat(feeConfig?.monthlyFee || "0");
    expectedRevenue += monthlyFee;

    // Find this student's latest monthly payment with a coverageEnd date
    const studentMonthlyPayments = allPayments.filter(
      p => p.studentId === student.id && p.paymentType === "monthly" && p.coverageEnd
    );
    
    let maxCoverageEnd: string | null = null;
    for (const p of studentMonthlyPayments) {
      if (!maxCoverageEnd || p.coverageEnd! > maxCoverageEnd) {
        maxCoverageEnd = p.coverageEnd!;
      }
    }

    if (!maxCoverageEnd) {
      // No coverage at all → overdue
      overdueCount++;
      needsAttention.push({
        studentId: student.id,
        studentName: student.name,
        type: "overdue",
        amount: monthlyFee,
        phone: primaryContact?.phone,
      });
    } else if (maxCoverageEnd >= todayStr) {
      // Coverage still valid → paid
      paidCount++;
    } else {
      // Coverage expired → overdue
      const daysLate = Math.floor(
        (today.getTime() - new Date(maxCoverageEnd + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24)
      );
      overdueCount++;
      needsAttention.push({
        studentId: student.id,
        studentName: student.name,
        type: "overdue",
        amount: monthlyFee,
        daysOverdue: daysLate,
        coveredUntil: maxCoverageEnd,
        phone: primaryContact?.phone,
      });
    }
    
    // Check for blocked students
    if (student.status === "frozen") {
      const existingIndex = needsAttention.findIndex(n => n.studentId === student.id);
      if (existingIndex >= 0) {
        needsAttention[existingIndex].type = "blocked";
      } else {
        needsAttention.unshift({
          studentId: student.id,
          studentName: student.name,
          type: "blocked",
          phone: primaryContact?.phone,
        });
      }
    }
  }
  
  // --- Collected revenue: sum of ALL payments whose payment_date falls in the
  //     selected month (actual money received, matching what the CSV shows).
  const now = new Date();
  const currentYM = yearMonth ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const collectedRevenue = allPayments
    .filter(p => {
      const d = new Date(p.paymentDate + "T00:00:00");
      const pYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return pYM === currentYM;
    })
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  // Calculate collection rate
  const collectionRate = expectedRevenue > 0 
    ? Math.round((collectedRevenue / expectedRevenue) * 100) 
    : 0;
  
  // Calculate lead stats
  const totalLeads = allLeads.length;
  const newLeads = allLeads.filter(l => l.status === "new").length;
  
  // Sort attention items: blocked first, then overdue, then partial
  needsAttention.sort((a, b) => {
    const priority = { blocked: 0, overdue: 1, partial: 2 };
    return priority[a.type] - priority[b.type];
  });
  
  return {
    totalStudents,
    activeStudents,
    trialStudents,
    frozenStudents,
    paidCount,
    partialCount,
    overdueCount,
    expectedRevenue,
    collectedRevenue,
    collectionRate,
    totalLeads,
    newLeads,
    selectedMonth: yearMonth || null,
    needsAttention: needsAttention.slice(0, 10), // Top 10
  };
}
