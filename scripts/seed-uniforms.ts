// Run: npx tsx scripts/seed-uniforms.ts
// Seeds uniform records from Membership CSV data
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim();
if (!dbUrl) throw new Error('DATABASE_URL not found');

const sql = neon(dbUrl);

interface UniformEntry {
  studentName: string;
  type: 'red' | 'navy';
  givenDate: string;
  price: number;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
}

// Complete uniform data compiled from Membership CSV + Revenue CSV
const uniformData: UniformEntry[] = [
  // ===== OLD RED UNIFORMS (الطقم القديم) =====
  
  // --- GIFTS (هدية) - price 0 ---
  { studentName: 'آدم الشيخ صالح', type: 'red', givenDate: '2023-08-18', price: 0, isPaid: true, paidDate: '2023-08-18', notes: 'هدية - الطقم القديم' },
  { studentName: 'علي ماوردي', type: 'red', givenDate: '2023-10-11', price: 0, isPaid: true, paidDate: '2023-10-11', notes: 'هدية - الطقم القديم' },
  { studentName: 'ماهر أبو حمدي', type: 'red', givenDate: '2023-11-01', price: 0, isPaid: true, paidDate: '2023-11-01', notes: 'هدية - الطقم القديم' },
  { studentName: 'نوح الشيخ صالح', type: 'red', givenDate: '2024-04-08', price: 0, isPaid: true, paidDate: '2024-04-08', notes: 'هدية - الطقم القديم' },
  { studentName: 'حمزة عبادة', type: 'red', givenDate: '2025-01-29', price: 0, isPaid: true, paidDate: '2025-01-29', notes: 'هدية - الطقم القديم' },
  { studentName: 'يامن الطبشة', type: 'red', givenDate: '2025-07-26', price: 0, isPaid: true, paidDate: '2025-07-26', notes: 'هدية - الطقم القديم' },
  { studentName: 'يوسف آرداملي', type: 'red', givenDate: '2025-10-11', price: 0, isPaid: true, paidDate: '2025-10-11', notes: 'هدية - الطقم القديم' },
  { studentName: 'محمد طارق العلبي', type: 'red', givenDate: '2025-12-13', price: 0, isPaid: true, paidDate: '2025-12-13', notes: 'هدية - الطقم القديم' },
  
  // --- PAID OLD UNIFORMS (مدفوع) ---
  { studentName: 'أحمد زين سلطان', type: 'red', givenDate: '2023-07-17', price: 1000, isPaid: true, paidDate: '2023-07-17', notes: 'الطقم القديم' },
  { studentName: 'محمد عزام', type: 'red', givenDate: '2023-09-01', price: 1000, isPaid: true, paidDate: '2023-09-01', notes: 'الطقم القديم' },
  { studentName: 'يزن ميستو', type: 'red', givenDate: '2023-11-20', price: 1000, isPaid: true, paidDate: '2023-11-20', notes: 'الطقم القديم' },
  { studentName: 'محمد الفاتح قولي', type: 'red', givenDate: '2024-09-08', price: 1000, isPaid: true, paidDate: '2024-09-08', notes: 'الطقم القديم' },
  { studentName: 'محمد هارون كايا', type: 'red', givenDate: '2024-09-14', price: 1000, isPaid: true, paidDate: '2024-09-14', notes: 'الطقم القديم' },
  { studentName: 'سفيان هارون كايا', type: 'red', givenDate: '2024-09-14', price: 1000, isPaid: true, paidDate: '2024-09-14', notes: 'الطقم القديم' },
  { studentName: 'عكرمة مصطفى أوغلو', type: 'red', givenDate: '2024-09-21', price: 1000, isPaid: true, paidDate: '2024-09-21', notes: 'الطقم القديم' },
  { studentName: 'يحيى أوزيل', type: 'red', givenDate: '2024-11-02', price: 1000, isPaid: true, paidDate: '2024-11-02', notes: 'الطقم القديم' },
  { studentName: 'حسام صمودي', type: 'red', givenDate: '2025-07-02', price: 1000, isPaid: true, paidDate: '2025-07-02', notes: 'الطقم القديم' },
  { studentName: 'زيد كوتشاك', type: 'red', givenDate: '2025-07-19', price: 1000, isPaid: true, paidDate: '2025-07-19', notes: 'الطقم القديم' },
  { studentName: 'كريم لطوف', type: 'red', givenDate: '2025-10-15', price: 1000, isPaid: true, paidDate: '2025-10-15', notes: 'الطقم القديم' },
  { studentName: 'أحمد جاد عتيق', type: 'red', givenDate: '2025-10-25', price: 1000, isPaid: true, paidDate: '2025-10-25', notes: 'الطقم القديم' },
  { studentName: 'ياسين المصري', type: 'red', givenDate: '2025-11-01', price: 1000, isPaid: true, paidDate: '2025-11-08', notes: 'الطقم القديم - يشمل في الاشتراك' },
  { studentName: 'عبدالله المبروك', type: 'red', givenDate: '2025-11-01', price: 1000, isPaid: true, paidDate: '2025-11-15', notes: 'الطقم القديم - يشمل في الاشتراك' },
  { studentName: 'أحمد الطويل', type: 'red', givenDate: '2025-11-15', price: 1000, isPaid: true, paidDate: '2025-11-22', notes: 'الطقم القديم - يشمل في الاشتراك' },
  { studentName: 'إيهاب عفانة', type: 'red', givenDate: '2025-11-30', price: 1000, isPaid: true, paidDate: '2025-12-06', notes: 'الطقم القديم - يشمل في الاشتراك' },
  { studentName: 'يوسف أبو خلف', type: 'red', givenDate: '2025-12-06', price: 1000, isPaid: true, paidDate: '2025-12-06', notes: 'الطقم القديم - يشمل في الاشتراك' },
  { studentName: 'عمر شاكر', type: 'red', givenDate: '2025-12-06', price: 1000, isPaid: true, paidDate: '2025-12-07', notes: 'الطقم القديم' },
  { studentName: 'زيد يحيى زكريا', type: 'red', givenDate: '2025-12-07', price: 1000, isPaid: true, paidDate: '2025-12-09', notes: 'الطقم القديم - اشتراك 4000 + 1000 طقم' },
  { studentName: 'آسر منشاوي', type: 'red', givenDate: '2025-12-07', price: 1000, isPaid: true, paidDate: '2025-12-08', notes: 'الطقم القديم - يشمل في الاشتراك' },
  { studentName: 'عبدالفتاح مهنا', type: 'red', givenDate: '2025-12-13', price: 1000, isPaid: true, paidDate: '2025-12-14', notes: 'الطقم القديم - يشمل في الاشتراك' },
  
  // ===== NEW RED UNIFORMS (الطقم الجديد الأحمر) =====
  
  // Paid new red uniforms
  { studentName: 'زيد كوتشاك', type: 'red', givenDate: '2025-12-26', price: 1000, isPaid: true, paidDate: '2025-12-26', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'يحيى أوزيل', type: 'red', givenDate: '2025-12-20', price: 1000, isPaid: true, paidDate: '2025-12-20', notes: 'الطقم الجديد الأحمر - يشمل في الاشتراك' },
  { studentName: 'حسام صمودي', type: 'red', givenDate: '2025-12-20', price: 1000, isPaid: true, paidDate: '2025-12-20', notes: 'الطقم الجديد الأحمر - يشمل في الاشتراك' },
  { studentName: 'عكرمة مصطفى أوغلو', type: 'red', givenDate: '2025-12-21', price: 1000, isPaid: true, paidDate: '2026-02-08', notes: 'الطقم الجديد الأحمر - باقي 1000 تم دفعه' },
  { studentName: 'صهيب الذيب', type: 'red', givenDate: '2026-01-01', price: 1000, isPaid: true, paidDate: '2026-01-14', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'قصي الذيب', type: 'red', givenDate: '2026-01-01', price: 1000, isPaid: true, paidDate: '2026-01-14', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'يمان نجيب', type: 'red', givenDate: '2026-01-01', price: 1000, isPaid: true, paidDate: '2026-01-12', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'يزن ميستو', type: 'red', givenDate: '2026-01-04', price: 1000, isPaid: true, paidDate: '2026-01-04', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'أحمد جاد عتيق', type: 'red', givenDate: '2026-01-05', price: 1000, isPaid: true, paidDate: '2026-01-05', notes: 'الطقم الجديد الأحمر - يشمل في الاشتراك' },
  { studentName: 'شهاب الدين أبو معمر', type: 'red', givenDate: '2026-01-24', price: 1000, isPaid: true, paidDate: '2026-01-24', notes: 'الطقم الجديد الأحمر - يشمل في الاشتراك' },
  { studentName: 'محمد عزام', type: 'red', givenDate: '2026-01-31', price: 2000, isPaid: true, paidDate: '2026-01-31', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'محمد أمير دهان', type: 'red', givenDate: '2026-02-01', price: 1000, isPaid: true, paidDate: '2026-02-01', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'سليمان المشوخي', type: 'red', givenDate: '2026-02-03', price: 1000, isPaid: true, paidDate: '2026-02-03', notes: 'الطقم الجديد الأحمر - يشمل في الاشتراك' },
  { studentName: 'شهاب الدين أبو معمر', type: 'red', givenDate: '2026-02-06', price: 2000, isPaid: true, paidDate: '2026-02-06', notes: 'الطقم الجديد الأحمر - طقم إضافي' },
  { studentName: 'حارث إبراهيم', type: 'red', givenDate: '2026-02-08', price: 2000, isPaid: true, paidDate: '2026-02-08', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'عمر إبراهيم', type: 'red', givenDate: '2026-02-08', price: 2000, isPaid: true, paidDate: '2026-02-08', notes: 'الطقم الجديد الأحمر' },
  { studentName: 'محمد أمير دهان', type: 'red', givenDate: '2026-02-01', price: 1000, isPaid: true, paidDate: '2026-02-01', notes: 'الطقم القديم' },
  { studentName: 'عبدالله المبروك', type: 'red', givenDate: '2026-02-15', price: 1000, isPaid: true, paidDate: '2026-02-15', notes: 'الطقم الجديد الأحمر' },

  // UNPAID new red uniforms (غير مدفوع) - THESE WILL ALERT!
  { studentName: 'محمد عامر بيساني', type: 'red', givenDate: '2025-12-15', price: 1000, isPaid: false, notes: 'الطقم الجديد الأحمر - غير مدفوع' },
  
  // ===== NEW NAVY UNIFORMS (الطقم الجديد الأزرق) =====
  { studentName: 'محمد هارون كايا', type: 'navy', givenDate: '2026-02-01', price: 2000, isPaid: true, paidDate: '2026-02-01', notes: 'الطقم الجديد الأزرق - يشمل في الاشتراك' },
  { studentName: 'سفيان هارون كايا', type: 'navy', givenDate: '2026-02-01', price: 2000, isPaid: true, paidDate: '2026-02-01', notes: 'الطقم الجديد الأزرق - يشمل في الاشتراك' },
];

async function main() {
  console.log('🔍 Fetching students from DB...');
  const students = await sql`SELECT id, name FROM students ORDER BY name`;
  
  const nameToId = new Map<string, string>();
  for (const s of students) {
    nameToId.set(s.name as string, s.id as string);
  }
  
  console.log(`Found ${students.length} students\n`);
  
  // Check for existing uniform records
  const existing = await sql`SELECT COUNT(*) as count FROM uniform_records`;
  const existingCount = Number(existing[0].count);
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing uniform records. Clearing them first...`);
    await sql`DELETE FROM uniform_records`;
    console.log('   Cleared existing records.\n');
  }
  
  let inserted = 0;
  let skipped = 0;
  const notFound: string[] = [];
  
  for (const entry of uniformData) {
    const studentId = nameToId.get(entry.studentName);
    if (!studentId) {
      if (!notFound.includes(entry.studentName)) {
        notFound.push(entry.studentName);
      }
      skipped++;
      continue;
    }
    
    await sql`
      INSERT INTO uniform_records (student_id, uniform_type, given_date, price, is_paid, paid_date, notes)
      VALUES (${studentId}, ${entry.type}, ${entry.givenDate}, ${entry.price}, ${entry.isPaid}, ${entry.paidDate || null}, ${entry.notes || null})
    `;
    inserted++;
    console.log(`  ✅ ${entry.studentName} | ${entry.type} | ${entry.isPaid ? 'مدفوع' : '❌ غير مدفوع'} | ${entry.price} TL`);
  }
  
  console.log(`\n===== SUMMARY =====`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  if (notFound.length > 0) {
    console.log(`\nStudents NOT found in DB:`);
    for (const n of notFound) {
      console.log(`  ❌ ${n}`);
    }
  }
  
  // Report students who did NOT receive any uniform
  const studentsWithUniform = new Set(uniformData.map(u => u.studentName));
  const noUniform = students.filter(s => !studentsWithUniform.has(s.name as string));
  
  console.log(`\n===== STUDENTS WITHOUT UNIFORM RECORDS =====`);
  console.log(`(لم يستلم / not in Membership CSV)`);
  for (const s of noUniform) {
    console.log(`  ⚪ ${s.name}`);
  }
  
  // Report unpaid uniforms
  console.log(`\n===== UNPAID RED UNIFORMS (ALERTS!) =====`);
  const unpaid = uniformData.filter(u => !u.isPaid && u.type === 'red');
  for (const u of unpaid) {
    console.log(`  🔴 ${u.studentName} | ${u.price} TL | given: ${u.givenDate}`);
  }
  if (unpaid.length === 0) {
    console.log('  None');
  }
  
  console.log('\n✅ Uniform seeding complete!');
}

main().catch(console.error);
