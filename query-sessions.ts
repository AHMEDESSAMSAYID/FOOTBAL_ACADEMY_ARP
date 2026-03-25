import { db } from './src/db';
import { trainingSessions, attendance, students } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function checkData() {
  try {
    // 1. Check training sessions - show actual date values
    console.log('\n========== TRAINING SESSIONS SAMPLE DATA ==========');
    const sessions = await db.select().from(trainingSessions).limit(10);
    console.log(`Found ${sessions.length} training sessions`);
    console.log('Sample data from training_sessions table:');
    sessions.forEach(s => {
      console.log(`- Session ID: ${s.id}`);
      console.log(`  Date: ${s.sessionDate} (Type: ${typeof s.sessionDate})`);
      console.log(`  Day of Week: ${s.dayOfWeek}`);
      console.log(`  Age Group: ${s.ageGroup}`);
      console.log(`  Created: ${s.createdAt}\n`);
    });

    // 2. Check for March 2026 training sessions
    console.log('\n========== MARCH 2026 TRAINING SESSIONS ==========');
    const marchSessions = await db.select().from(trainingSessions)
      .where(sql`EXTRACT(year FROM ${trainingSessions.sessionDate}) = 2026 AND EXTRACT(month FROM ${trainingSessions.sessionDate}) = 3`);
    
    console.log(`Training sessions in March 2026: ${marchSessions.length}`);
    if (marchSessions.length > 0) {
      marchSessions.slice(0, 5).forEach(s => {
        console.log(`- ${s.sessionDate} (${s.dayOfWeek}, ${s.ageGroup})`);
      });
    }

    // 3. Check attendance linked to training sessions
    console.log('\n========== ATTENDANCE RECORDS ==========');
    const attendanceRecords = await db.select().from(attendance).limit(10);
    console.log(`Total attendance records checked: ${attendanceRecords.length}`);
    
    if (attendanceRecords.length > 0) {
      console.log('Sample attendance records:');
      attendanceRecords.forEach(a => {
        console.log(`- Attendance ID: ${a.id}`);
        console.log(`  Session ID: ${a.sessionId}`);
        console.log(`  Student ID: ${a.studentId}`);
        console.log(`  Status: ${a.status}`);
        console.log(`  Created: ${a.createdAt}\n`);
      });
    } else {
      console.log('No attendance records found');
    }

    // 4. Check total counts
    console.log('\n========== DATABASE STATISTICS ==========');
    const [{ count: totalSessions }] = await db.select({ count: sql`COUNT(*)` }).from(trainingSessions);
    const [{ count: totalAttendance }] = await db.select({ count: sql`COUNT(*)` }).from(attendance);
    
    console.log(`Total training sessions in database: ${totalSessions}`);
    console.log(`Total attendance records in database: ${totalAttendance}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  process.exit(0);
}

checkData();
