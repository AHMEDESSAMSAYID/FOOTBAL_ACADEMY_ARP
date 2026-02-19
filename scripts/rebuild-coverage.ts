/**
 * Rebuild payment_coverage from existing payments.
 *
 * The sync-payments script cleared the coverage table but never
 * recreated it. This script reads every payment that has
 * coverageStart / coverageEnd and generates the matching
 * paymentCoverage rows so the dashboard & payments page show
 * correct paid / partial / overdue numbers.
 *
 * Usage:  npx tsx scripts/rebuild-coverage.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given "2025-12-12" → "2026-01-12" return ["2025-12"].
 * Given "2025-10-12" → "2026-04-12" return
 *   ["2025-10","2025-11","2025-12","2026-01","2026-02","2026-03"].
 */
function getYearMonths(coverageStart: string, coverageEnd: string): string[] {
  const start = new Date(coverageStart + "T00:00:00");
  const end = new Date(coverageEnd + "T00:00:00");
  const months: string[] = [];

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current < endMonth) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
  }

  // Edge case: both dates in the same calendar month
  if (months.length === 0) {
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }

  return months;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🔄 Rebuilding payment coverage…\n");

  // 1. Clear existing coverage
  await db.execute(sql`DELETE FROM payment_coverage`);
  console.log("  🗑️  Cleared existing payment_coverage\n");

  // 2. Load data
  const allPayments = await db.select().from(schema.payments);
  const allFeeConfigs = await db.select().from(schema.feeConfigs);

  console.log(`  📦 ${allPayments.length} payments loaded`);
  console.log(`  📦 ${allFeeConfigs.length} fee configs loaded\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const payment of allPayments) {
    // Uniforms don't produce coverage rows
    if (payment.paymentType === "uniform") {
      skipped++;
      continue;
    }
    // Payments without coverage dates can't be mapped to months
    if (!payment.coverageStart || !payment.coverageEnd) {
      skipped++;
      continue;
    }

    const yearMonths = getYearMonths(payment.coverageStart, payment.coverageEnd);
    const feeType: "monthly" | "bus" =
      payment.paymentType === "monthly" ? "monthly" : "bus";

    const feeConfig = allFeeConfigs.find(
      (fc) => fc.studentId === payment.studentId
    );

    const amountDue =
      feeType === "monthly"
        ? parseFloat(feeConfig?.monthlyFee || "0")
        : parseFloat(feeConfig?.busFee || "0");

    const amountPerMonth = parseFloat(payment.amount) / yearMonths.length;

    for (const yearMonth of yearMonths) {
      // Check if another payment already created coverage for this slot
      const existing = await db.query.paymentCoverage.findFirst({
        where: (pc, { and: a }) =>
          a(
            eq(pc.studentId, payment.studentId),
            eq(pc.yearMonth, yearMonth),
            eq(pc.feeType, feeType)
          ),
      });

      if (existing) {
        const newPaid = parseFloat(existing.amountPaid) + amountPerMonth;
        const status = newPaid >= amountDue ? "paid" : "partial";
        await db
          .update(schema.paymentCoverage)
          .set({
            amountPaid: newPaid.toString(),
            status,
            paymentId: payment.id,
          })
          .where(eq(schema.paymentCoverage.id, existing.id));
        updated++;
      } else {
        const status = amountPerMonth >= amountDue ? "paid" : "partial";
        await db.insert(schema.paymentCoverage).values({
          studentId: payment.studentId,
          feeType,
          yearMonth,
          amountDue: amountDue.toString(),
          amountPaid: amountPerMonth.toString(),
          status,
          paymentId: payment.id,
        });
        created++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Created: ${created} coverage records`);
  console.log(`  🔄 Updated (merged): ${updated} coverage records`);
  console.log(`  ⏩ Skipped: ${skipped} payments (uniform / no dates)`);
  console.log("\n✅ Coverage rebuild complete!");
}

main().catch(console.error);
