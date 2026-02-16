// Run: npx tsx scripts/fix-coverage.ts
// Fixes coverage yearMonth misalignments based on Membership/Revenue CSV data
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim();
if (!dbUrl) throw new Error('DATABASE_URL not found');

const sql = neon(dbUrl);

function getBillingDay(regDate: string): number {
  return new Date(regDate + 'T00:00:00').getDate();
}

function getCurrentDueYearMonth(regDate: string, refDate = new Date()): string {
  const billingDay = getBillingDay(regDate);
  const today = new Date(refDate);
  today.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const effectiveBillingDay = Math.min(billingDay, daysInMonth);

  let dueYear: number, dueMonth: number;
  if (today.getDate() >= effectiveBillingDay) {
    dueYear = today.getFullYear();
    dueMonth = today.getMonth() + 1;
  } else {
    const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    dueYear = prev.getFullYear();
    dueMonth = prev.getMonth() + 1;
  }
  return `${dueYear}-${String(dueMonth).padStart(2, '0')}`;
}

async function main() {
  console.log('📊 Analyzing payment coverage alignment...\n');
  
  const students = await sql`
    SELECT s.id, s.name, s.status, s.registration_date,
           fc.monthly_fee
    FROM students s
    LEFT JOIN fee_configs fc ON fc.student_id = s.id
    WHERE s.status = 'active'
    ORDER BY s.name
  `;

  const coverageAll = await sql`SELECT * FROM payment_coverage WHERE fee_type = 'monthly' ORDER BY year_month`;
  
  const today = new Date('2026-02-16T00:00:00');
  
  console.log('=== OVERDUE ANALYSIS ===\n');
  
  const issues: Array<{student: string, studentId: string, problem: string, fix?: string}> = [];
  
  for (const s of students) {
    if (!s.monthly_fee) continue;
    
    const regDate = new Date(s.registration_date as string).toISOString().split('T')[0];
    const billingDay = getBillingDay(regDate);
    const currentDue = getCurrentDueYearMonth(regDate, today);
    
    const coverage = coverageAll.filter((c: any) => c.student_id === s.id);
    const covMonths = coverage.map((c: any) => c.year_month);
    
    const hasCurrent = covMonths.includes(currentDue);
    
    if (!hasCurrent) {
      // Check if they have a FUTURE month but not the current one (yearMonth misalignment)
      const futureMonths = covMonths.filter((m: string) => m > currentDue);
      const missingPrev = covMonths.filter((m: string) => m < currentDue);
      
      let status = 'OVERDUE (no payment for current period)';
      let fix = undefined;
      
      if (futureMonths.length > 0) {
        // Has future month but not current - likely yearMonth misalignment
        status = `⚠️ MISALIGNED: missing ${currentDue}, but has ${futureMonths.join(', ')}`;
        fix = `UPDATE: Change ${futureMonths[0]} → ${currentDue}`;
      }
      
      issues.push({
        student: s.name as string,
        studentId: s.id as string,
        problem: status,
        fix
      });
      
      console.log(`${s.name} (billing day ${billingDay}, due: ${currentDue})`);
      console.log(`  Coverage: ${covMonths.join(', ') || 'NONE'}`);
      console.log(`  Status: ${status}`);
      if (fix) console.log(`  🔧 Fix: ${fix}`);
      console.log();
    }
  }
  
  // Auto-fix misaligned coverage
  const fixable = issues.filter(i => i.fix);
  
  if (fixable.length > 0) {
    console.log('\n=== APPLYING FIXES ===\n');
    
    for (const issue of fixable) {
      // Find the coverage record with the wrong yearMonth
      const coverage = coverageAll.filter((c: any) => c.student_id === issue.studentId);
      const regDate = (students.find((s: any) => s.id === issue.studentId) as any).registration_date;
      const currentDue = getCurrentDueYearMonth(new Date(regDate as string).toISOString().split('T')[0], today);
      
      const wrongRecord = coverage.find((c: any) => c.year_month > currentDue);
      
      if (wrongRecord) {
        // Check if currentDue already exists (avoid conflict)
        const exists = coverage.find((c: any) => c.year_month === currentDue);
        if (exists) {
          console.log(`  ⏭️ ${issue.student}: ${currentDue} already exists, skipping`);
          continue;
        }
        
        console.log(`  🔧 ${issue.student}: ${wrongRecord.year_month} → ${currentDue}`);
        await sql`
          UPDATE payment_coverage 
          SET year_month = ${currentDue}
          WHERE id = ${wrongRecord.id}
        `;
        console.log(`     ✅ Fixed!`);
      }
    }
  } else {
    console.log('\nNo automatic fixes available. All overdue students genuinely need payment.');
  }
  
  // Report students WITHOUT any coverage or fee config
  console.log('\n=== STUDENTS WITH NO FEE CONFIG (not billable) ===');
  const noFee = students.filter((s: any) => !s.monthly_fee);
  for (const s of noFee) {
    console.log(`  ⚪ ${s.name}`);
  }
  
  // Report overpaid coverage issues
  console.log('\n=== OVERPAID/INFLATED COVERAGE ===');
  for (const c of coverageAll) {
    const paid = parseFloat(c.amount_paid as string);
    const due = parseFloat(c.amount_due as string);
    if (paid > due * 1.5) {
      const student = students.find((s: any) => s.id === c.student_id);
      console.log(`  ⚠️ ${(student as any)?.name} | ${c.year_month} | paid: ${paid} / due: ${due} (${Math.round(paid/due*100)}%)`);
    }
  }
  
  console.log('\n✅ Coverage analysis complete!');
}

main().catch(console.error);
