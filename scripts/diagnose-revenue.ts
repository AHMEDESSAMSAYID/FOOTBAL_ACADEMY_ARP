/**
 * Diagnose revenue discrepancy between CSV and dashboard.
 * Run: npx tsx scripts/diagnose-revenue.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  // 1. Sum all payments grouped by their payment date month
  const paymentsByMonth = await db.execute(sql`
    SELECT 
      to_char(payment_date::date, 'YYYY-MM') as month,
      COUNT(*) as cnt,
      SUM(amount::numeric) as total
    FROM payments
    GROUP BY to_char(payment_date::date, 'YYYY-MM')
    ORDER BY month
  `);
  
  console.log("\n=== PAYMENTS BY DATE MONTH (actual money received) ===");
  let grandTotal = 0;
  for (const row of paymentsByMonth.rows) {
    const t = Number(row.total);
    grandTotal += t;
    console.log(`  ${row.month}: ${row.cnt} payments, ${t.toLocaleString()} TL`);
  }
  console.log(`  GRAND TOTAL: ${grandTotal.toLocaleString()} TL`);

  // 2. Sum coverage amounts grouped by yearMonth
  const coverageByMonth = await db.execute(sql`
    SELECT 
      year_month,
      COUNT(*) as cnt,
      SUM(amount_paid::numeric) as total_paid,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_cnt,
      SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_cnt
    FROM payment_coverage
    GROUP BY year_month
    ORDER BY year_month
  `);
  
  console.log("\n=== COVERAGE BY YEAR_MONTH (billing cycle) ===");
  for (const row of coverageByMonth.rows) {
    console.log(`  ${row.year_month}: ${row.cnt} records, ${Number(row.total_paid).toLocaleString()} TL (paid: ${row.paid_cnt}, partial: ${row.partial_cnt})`);
  }

  // 3. For January 2026 specifically, show all payments
  const jan2026 = await db.execute(sql`
    SELECT 
      p.payment_date, p.amount, p.payment_type, p.notes,
      s.name as student_name
    FROM payments p
    JOIN students s ON s.id = p.student_id
    WHERE to_char(p.payment_date::date, 'YYYY-MM') = '2026-01'
    ORDER BY p.payment_date, s.name
  `);
  
  console.log("\n=== JANUARY 2026 PAYMENTS (detail) ===");
  let janTotal = 0;
  for (const row of jan2026.rows) {
    const amt = Number(row.amount);
    janTotal += amt;
    console.log(`  ${row.payment_date} | ${row.student_name} | ${amt.toLocaleString()} TL | ${row.payment_type} | ${row.notes || ""}`);    
  }
  console.log(`  JANUARY 2026 TOTAL: ${janTotal.toLocaleString()} TL`);

  // 4. Check what the dashboard would compute for expected revenue in Jan 2026
  const feeConfigs = await db.execute(sql`
    SELECT fc.monthly_fee, s.name, s.registration_date, s.status
    FROM fee_configs fc
    JOIN students s ON s.id = fc.student_id
    ORDER BY s.name
  `);
  
  console.log("\n=== FEE CONFIGS (expected monthly from each student) ===");
  let expectedTotal = 0;
  let jan2026eligible = 0;
  for (const row of feeConfigs.rows) {
    const fee = Number(row.monthly_fee);
    expectedTotal += fee;
    const regDate = new Date(row.registration_date + "T00:00:00");
    const regYM = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, "0")}`;
    if (regYM <= "2026-01") {
      jan2026eligible++;
      console.log(`  ${row.name}: ${fee.toLocaleString()} TL (reg: ${row.registration_date}, status: ${row.status})`);
    }
  }
  console.log(`  Total expected (all): ${expectedTotal.toLocaleString()} TL`);
  console.log(`  Students eligible for Jan 2026: ${jan2026eligible}`);

  // 5. What coverage says for Jan 2026
  const coverageJan = await db.execute(sql`
    SELECT 
      pc.year_month, pc.amount_paid, pc.status, pc.fee_type,
      s.name as student_name
    FROM payment_coverage pc
    JOIN students s ON s.id = pc.student_id
    WHERE pc.year_month = '2026-01'
    ORDER BY s.name
  `);
  
  console.log("\n=== COVERAGE FOR 2026-01 ===");
  let covTotal = 0;
  for (const row of coverageJan.rows) {
    const amt = Number(row.amount_paid);
    covTotal += amt;
    console.log(`  ${row.student_name}: ${amt.toLocaleString()} TL (${row.status}, ${row.fee_type})`);
  }
  console.log(`  COVERAGE TOTAL: ${covTotal.toLocaleString()} TL`);
}

main().catch(console.error);
