// Run: npx tsx scripts/diagnostic.ts
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim();
if (!dbUrl) throw new Error('DATABASE_URL not found');

const sql = neon(dbUrl);

async function main() {
  // 1. List all students
  const students = await sql`SELECT id, name, status, registration_date FROM students ORDER BY name`;
  console.log('=== STUDENTS IN DB ===');
  for (const s of students) {
    console.log(`${s.name} | ${s.status} | reg: ${s.registration_date}`);
  }
  console.log(`Total: ${students.length}\n`);

  // 2. Existing uniform records
  const uniforms = await sql`SELECT ur.*, s.name as student_name FROM uniform_records ur JOIN students s ON ur.student_id = s.id ORDER BY s.name`;
  console.log('=== EXISTING UNIFORM RECORDS ===');
  console.log(`Total: ${uniforms.length}`);
  for (const u of uniforms) {
    console.log(`  ${u.student_name} | ${u.uniform_type} | paid: ${u.is_paid} | price: ${u.price} | given: ${u.given_date}`);
  }

  // 3. Payment coverage summary per student
  console.log('\n=== PAYMENT COVERAGE PER STUDENT ===');
  const coverage = await sql`
    SELECT s.name, s.status, pc.fee_type, pc.year_month, pc.status as cov_status, pc.amount_paid, pc.amount_due
    FROM students s
    LEFT JOIN payment_coverage pc ON pc.student_id = s.id
    WHERE s.status = 'active'
    ORDER BY s.name, pc.year_month
  `;
  
  let currentStudent = '';
  for (const c of coverage) {
    if (c.name !== currentStudent) {
      currentStudent = c.name;
      console.log(`\n  ${c.name} (${c.status}):`);
    }
    if (c.year_month) {
      console.log(`    ${c.fee_type} | ${c.year_month} | ${c.cov_status} | ${c.amount_paid}/${c.amount_due}`);
    } else {
      console.log(`    NO COVERAGE RECORDS`);
    }
  }

  // 4. Recent payments
  console.log('\n\n=== PAYMENTS (last 50) ===');
  const payments = await sql`
    SELECT p.amount, p.payment_type, p.payment_date, p.coverage_start, p.coverage_end, p.notes, s.name
    FROM payments p JOIN students s ON p.student_id = s.id
    ORDER BY p.payment_date DESC LIMIT 50
  `;
  for (const p of payments) {
    console.log(`  ${p.name} | ${p.payment_type} | ${p.amount} TL | ${p.payment_date} | cover: ${p.coverage_start || '-'} to ${p.coverage_end || '-'} | ${p.notes || ''}`);
  }
}

main().catch(console.error);
