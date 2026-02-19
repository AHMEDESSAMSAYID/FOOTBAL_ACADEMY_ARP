import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  // 1. Count coverage records by yearMonth
  const byMonth = await db.execute(sql`
    SELECT year_month, fee_type, status, COUNT(*) as cnt 
    FROM payment_coverage 
    GROUP BY year_month, fee_type, status 
    ORDER BY year_month, fee_type, status
  `);
  console.log("\n📊 Coverage by yearMonth / feeType / status:");
  console.table(byMonth.rows);

  // 2. Total coverage records
  const total = await db.execute(sql`SELECT COUNT(*) as total FROM payment_coverage`);
  console.log("\nTotal coverage records:", total.rows[0]?.total);

  // 3. What does 2026-02 look like specifically?
  const feb = await db.execute(sql`
    SELECT pc.year_month, pc.fee_type, pc.status, pc.amount_due, pc.amount_paid, s.name
    FROM payment_coverage pc
    JOIN students s ON s.id = pc.student_id
    WHERE pc.year_month = '2026-02'
    ORDER BY s.name
  `);
  console.log("\n📊 Coverage for 2026-02:");
  console.table(feb.rows);

  // 4. Check distinct yearMonths
  const months = await db.execute(sql`SELECT DISTINCT year_month FROM payment_coverage ORDER BY year_month`);
  console.log("\nDistinct yearMonths:", months.rows.map((r: any) => r.year_month));
}

main().catch(console.error);
