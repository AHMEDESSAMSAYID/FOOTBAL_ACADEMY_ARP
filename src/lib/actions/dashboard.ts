"use server";

import { db } from "@/db";
import { students, payments, paymentCoverage, feeConfigs, leads, contacts } from "@/db/schema";
import { eq, sql, and, count, desc } from "drizzle-orm";

// Get current month in YYYY-MM format
function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

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
  
  // Attention items
  needsAttention: {
    studentId: string;
    studentName: string;
    type: "blocked" | "overdue" | "partial";
    amount?: number;
    daysOverdue?: number;
    phone?: string;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const currentYearMonth = getCurrentYearMonth();
  
  // Fetch all students
  const allStudents = await db.select().from(students);
  
  // Fetch all fee configs
  const allFeeConfigs = await db.select().from(feeConfigs);
  
  // Fetch current month coverage
  const currentMonthCoverage = await db
    .select()
    .from(paymentCoverage)
    .where(eq(paymentCoverage.yearMonth, currentYearMonth));
  
  // Fetch all contacts for phone numbers
  const allContacts = await db.select().from(contacts);
  
  // Fetch leads
  const allLeads = await db.select().from(leads);
  
  // Calculate student counts
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter(s => s.status === "active").length;
  const trialStudents = allStudents.filter(s => s.status === "trial").length;
  const frozenStudents = allStudents.filter(s => s.status === "frozen").length;
  
  // Calculate payment stats
  const studentsWithConfig = allStudents.filter(s => 
    allFeeConfigs.some(fc => fc.studentId === s.id)
  );
  
  let paidCount = 0;
  let partialCount = 0;
  let overdueCount = 0;
  let expectedRevenue = 0;
  let collectedRevenue = 0;
  
  const needsAttention: DashboardStats["needsAttention"] = [];
  
  for (const student of studentsWithConfig) {
    const feeConfig = allFeeConfigs.find(fc => fc.studentId === student.id);
    const monthlyCoverage = currentMonthCoverage.find(
      c => c.studentId === student.id && c.feeType === "monthly"
    );
    const primaryContact = allContacts.find(
      c => c.studentId === student.id && c.isPrimaryPayer
    ) || allContacts.find(c => c.studentId === student.id);
    
    const monthlyFee = parseFloat(feeConfig?.monthlyFee || "0");
    expectedRevenue += monthlyFee;
    
    if (monthlyCoverage) {
      const amountPaid = parseFloat(monthlyCoverage.amountPaid);
      collectedRevenue += amountPaid;
      
      if (monthlyCoverage.status === "paid") {
        paidCount++;
      } else if (monthlyCoverage.status === "partial") {
        partialCount++;
        needsAttention.push({
          studentId: student.id,
          studentName: student.name,
          type: "partial",
          amount: monthlyFee - amountPaid,
          phone: primaryContact?.phone,
        });
      } else {
        overdueCount++;
        needsAttention.push({
          studentId: student.id,
          studentName: student.name,
          type: "overdue",
          amount: monthlyFee,
          daysOverdue: Math.floor((Date.now() - new Date().setDate(1)) / (1000 * 60 * 60 * 24)),
          phone: primaryContact?.phone,
        });
      }
    } else {
      // No coverage = overdue
      overdueCount++;
      needsAttention.push({
        studentId: student.id,
        studentName: student.name,
        type: "overdue",
        amount: monthlyFee,
        daysOverdue: Math.floor((Date.now() - new Date().setDate(1)) / (1000 * 60 * 60 * 24)),
        phone: primaryContact?.phone,
      });
    }
    
    // Check for blocked students
    if (student.status === "frozen") {
      // Move to front of the list
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
    needsAttention: needsAttention.slice(0, 10), // Top 10
  };
}
