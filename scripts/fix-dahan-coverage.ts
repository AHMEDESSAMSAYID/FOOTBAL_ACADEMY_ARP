// Run: npx tsx scripts/fix-dahan-coverage.ts
// محمد أمير دهان paid 15,000 for 3 months starting from billing day 31 (reg 2026-02-01)
// Months should be: 2026-01 (already fixed), 2026-02, 2026-03 (not 2026-03, 2026-04)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim();
if (!dbUrl) throw new Error('DATABASE_URL not found');

const sql = neon(dbUrl);

async function main() {
  // Find محمد أمير دهان
  const students = await sql`SELECT id, name, registration_date FROM students WHERE name = 'محمد أمير دهان'`;
  if (students.length === 0) { console.log('Student not found'); return; }
  
  const studentId = students[0].id;
  console.log(`Found: ${students[0].name} (reg: ${students[0].registration_date})`);
  
  // Get current coverage
  const coverage = await sql`SELECT * FROM payment_coverage WHERE student_id = ${studentId} AND fee_type = 'monthly' ORDER BY year_month`;
  console.log('\nCurrent coverage:');
  for (const c of coverage) {
    console.log(`  ${c.year_month} | ${c.status} | ${c.amount_paid}/${c.amount_due}`);
  }
  
  // Fix: 2026-03 → 2026-02, 2026-04 → 2026-03
  console.log('\nApplying fixes...');
  
  const month03 = coverage.find((c: any) => c.year_month === '2026-03');
  const month04 = coverage.find((c: any) => c.year_month === '2026-04');
  
  if (month03) {
    await sql`UPDATE payment_coverage SET year_month = '2026-02' WHERE id = ${month03.id}`;
    console.log('  ✅ 2026-03 → 2026-02');
  }
  if (month04) {
    await sql`UPDATE payment_coverage SET year_month = '2026-03' WHERE id = ${month04.id}`;
    console.log('  ✅ 2026-04 → 2026-03');
  }
  
  // Verify
  const updated = await sql`SELECT * FROM payment_coverage WHERE student_id = ${studentId} AND fee_type = 'monthly' ORDER BY year_month`;
  console.log('\nUpdated coverage:');
  for (const c of updated) {
    console.log(`  ${c.year_month} | ${c.status} | ${c.amount_paid}/${c.amount_due}`);
  }
  
  console.log('\n✅ Done!');
}

main().catch(console.error);
