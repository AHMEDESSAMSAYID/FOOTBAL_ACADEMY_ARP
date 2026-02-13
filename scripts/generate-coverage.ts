/**
 * Generate payment_coverage records from existing payments
 * Run: npx tsx scripts/generate-coverage.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ===== SIBLING DETECTION =====
// Maps notes keywords to [primaryStudent, siblingStudent]
const SIBLING_KEYWORDS: [string, string, string][] = [
  ["آدم ونوح", "آدم الشيخ صالح", "نوح الشيخ صالح"],
  ["محمد وسفيان هارون", "محمد هارون كايا", "سفيان هارون كايا"],
  ["محمد وسفيان", "محمد هارون كايا", "سفيان هارون كايا"],
  ["صهيب وقصي", "صهيب الذيب", "قصي الذيب"],
  ["حارث وعمر", "حارث إبراهيم", "عمر إبراهيم"],
  ["حسن وبراء", "براء ماجد", "حسن ماجد"],
  ["حذيفة وأويس", "حذيفة أعويلي", "أويس أعويلي"],
];

/**
 * Given coverageStart and coverageEnd dates, return array of YYYY-MM strings.
 * E.g. "2025-10-12" to "2025-11-12" → ["2025-10"]
 * E.g. "2025-10-12" to "2026-02-12" → ["2025-10","2025-11","2025-12","2026-01"]
 */
function getMonthsBetween(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startYear = start.getFullYear();
  const startMonth = start.getMonth(); // 0-indexed
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  let totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

  // Minimum 1 month coverage
  if (totalMonths <= 0) totalMonths = 1;

  // Safety cap: no single payment covers more than 12 months
  if (totalMonths > 12) {
    console.warn(`  ⚠ Capping ${totalMonths} months to 12 for ${startDate} → ${endDate}`);
    totalMonths = 12;
  }

  const months: string[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    months.push(`${y}-${String(m + 1).padStart(2, "0")}`);
  }
  return months;
}

/**
 * Detect sibling from payment notes. Returns sibling student name or null.
 */
function detectSibling(notes: string | null, studentName: string): string | null {
  if (!notes) return null;
  for (const [keyword, name1, name2] of SIBLING_KEYWORDS) {
    if (notes.includes(keyword)) {
      if (studentName === name1) return name2;
      if (studentName === name2) return name1;
    }
  }
  return null;
}

async function generateCoverage() {
  console.log("🔄 Generating payment_coverage records from existing payments...\n");

  // 1) Clear existing coverage
  await db.delete(schema.paymentCoverage);
  console.log("🗑️  Cleared existing payment_coverage records");

  // 2) Load all data
  const allStudents = await db.select().from(schema.students);
  const allPayments = await db.select().from(schema.payments);
  const allFeeConfigs = await db.select().from(schema.feeConfigs);

  console.log(`📊 ${allStudents.length} students, ${allPayments.length} payments, ${allFeeConfigs.length} fee configs\n`);

  // Build lookups
  const studentById = new Map(allStudents.map(s => [s.id, s]));
  const studentByName = new Map(allStudents.map(s => [s.name, s]));
  const feeConfigByStudentId = new Map(allFeeConfigs.map(fc => [fc.studentId, fc]));

  // 3) Collect unique coverage entries: key = "studentId|yearMonth|feeType"
  const seen = new Set<string>();
  interface CoverageEntry {
    studentId: string;
    feeType: "monthly" | "bus";
    yearMonth: string;
    paymentId: string;
  }
  const entries: CoverageEntry[] = [];

  function addCoverage(studentId: string, yearMonth: string, feeType: "monthly" | "bus", paymentId: string) {
    const key = `${studentId}|${yearMonth}|${feeType}`;
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ studentId, feeType, yearMonth, paymentId });
  }

  // 4) Process each payment
  let processed = 0;
  let skipped = 0;

  for (const payment of allPayments) {
    // Skip uniforms
    if (payment.paymentType === "uniform") {
      skipped++;
      continue;
    }

    // Skip payments without coverage dates
    if (!payment.coverageStart || !payment.coverageEnd) {
      skipped++;
      continue;
    }

    const student = studentById.get(payment.studentId);
    if (!student) {
      skipped++;
      continue;
    }

    const feeType: "monthly" | "bus" = payment.paymentType === "bus" ? "bus" : "monthly";
    const months = getMonthsBetween(payment.coverageStart, payment.coverageEnd);

    // Add coverage for this student
    for (const ym of months) {
      addCoverage(payment.studentId, ym, feeType, payment.id);
    }

    // Check for sibling coverage
    const siblingName = detectSibling(payment.notes, student.name);
    if (siblingName) {
      const sibling = studentByName.get(siblingName);
      if (sibling) {
        for (const ym of months) {
          addCoverage(sibling.id, ym, feeType, payment.id);
        }
      } else {
        console.warn(`  ⚠ Sibling "${siblingName}" not found in students table`);
      }
    }

    processed++;
  }

  console.log(`📝 Processed ${processed} payments (skipped ${skipped})`);
  console.log(`📋 Generated ${entries.length} unique coverage entries\n`);

  // 5) Insert coverage records
  let insertCount = 0;
  let noFeeCount = 0;

  for (const entry of entries) {
    const feeConfig = feeConfigByStudentId.get(entry.studentId);
    const amountDue = entry.feeType === "monthly"
      ? parseFloat(feeConfig?.monthlyFee || "0")
      : parseFloat(feeConfig?.busFee || "0");

    if (amountDue === 0) {
      noFeeCount++;
      continue;
    }

    await db.insert(schema.paymentCoverage).values({
      studentId: entry.studentId,
      feeType: entry.feeType,
      yearMonth: entry.yearMonth,
      amountDue: amountDue.toString(),
      amountPaid: amountDue.toString(), // Mark as fully paid
      status: "paid",
      paymentId: entry.paymentId,
    });

    insertCount++;
  }

  if (noFeeCount > 0) {
    console.log(`⚠ ${noFeeCount} entries skipped (no fee config / fee = 0)`);
  }

  console.log(`\n✅ Inserted ${insertCount} payment_coverage records\n`);

  // 6) Print summary per student
  const studentCounts = new Map<string, number>();
  for (const entry of entries) {
    const feeConfig = feeConfigByStudentId.get(entry.studentId);
    const amountDue = entry.feeType === "monthly"
      ? parseFloat(feeConfig?.monthlyFee || "0")
      : parseFloat(feeConfig?.busFee || "0");
    if (amountDue === 0) continue;

    const student = studentById.get(entry.studentId);
    const name = student?.name || entry.studentId;
    studentCounts.set(name, (studentCounts.get(name) || 0) + 1);
  }

  console.log("📊 Per-student breakdown:");
  for (const [name, count] of [...studentCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${name}: ${count} months covered`);
  }
}

generateCoverage()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
  });
