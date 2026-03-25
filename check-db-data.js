#!/usr/bin/env node

// Direct database queries using Neon client
const { config } = require("dotenv");
config({ path: ".env.local" });

const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function checkData() {
  try {
    // 1. Check training sessions sample data
    console.log("\n========== TRAINING SESSIONS SAMPLE DATA ==========");
    const sessions = await sql`
      SELECT id, session_date, day_of_week, age_group, created_at 
      FROM training_sessions 
      ORDER BY session_date DESC 
      LIMIT 10
    `;
    console.log(`Found ${sessions.length} training sessions`);
    console.log("Sample data from training_sessions table:");
    sessions.forEach(s => {
      console.log(`- Session ID: ${s.id}`);
      console.log(`  Date: ${s.session_date} (Type of date: ${typeof s.session_date})`);
      console.log(`  Day of Week: ${s.day_of_week}`);
      console.log(`  Age Group: ${s.age_group}`);
      console.log(`  Created At: ${s.created_at}\n`);
    });

    // 2. Check for March 2026 training sessions
    console.log("\n========== MARCH 2026 TRAINING SESSIONS ==========");
    const marchSessions = await sql`
      SELECT id, session_date, day_of_week, age_group 
      FROM training_sessions 
      WHERE EXTRACT(YEAR FROM session_date) = 2026 
        AND EXTRACT(MONTH FROM session_date) = 3
      ORDER BY session_date
    `;

    console.log(`Training sessions in March 2026: ${marchSessions.length}`);
    if (marchSessions.length > 0) {
      marchSessions.slice(0, 5).forEach(s => {
        console.log(`- ${s.session_date} (${s.day_of_week}, ${s.age_group})`);
      });
    } else {
      console.log("(No sessions found for March 2026)");
    }

    // 3. Check attendance records
    console.log("\n========== ATTENDANCE RECORDS ==========");
    const attendanceRecords = await sql`
      SELECT id, session_id, student_id, status, created_at 
      FROM attendance 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    console.log(`Total attendance records (showing up to 10): ${attendanceRecords.length}`);
    if (attendanceRecords.length > 0) {
      console.log("Sample attendance records:");
      attendanceRecords.forEach(a => {
        console.log(`- Attendance ID: ${a.id}`);
        console.log(`  Session ID: ${a.session_id}`);
        console.log(`  Student ID: ${a.student_id}`);
        console.log(`  Status: ${a.status}`);
        console.log(`  Created: ${a.created_at}\n`);
      });
    } else {
      console.log("No attendance records found");
    }

    // 4. Database statistics
    console.log("\n========== DATABASE STATISTICS ==========");
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM training_sessions) as total_sessions,
        (SELECT COUNT(*) FROM attendance) as total_attendance
    `;

    console.log(`Total training sessions in database: ${stats[0].total_sessions}`);
    console.log(`Total attendance records in database: ${stats[0].total_attendance}`);

    // 5. Check attendance for March 2026 sessions
    console.log("\n========== MARCH 2026 ATTENDANCE RECORDS ==========");
    const marchAttendance = await sql`
      SELECT 
        a.id, 
        a.session_id, 
        a.student_id, 
        a.status, 
        ts.session_date,
        a.created_at 
      FROM attendance a
      JOIN training_sessions ts ON a.session_id = ts.id
      WHERE EXTRACT(YEAR FROM ts.session_date) = 2026 
        AND EXTRACT(MONTH FROM ts.session_date) = 3
      ORDER BY ts.session_date
      LIMIT 10
    `;

    console.log(`Attendance records for March 2026 sessions: ${marchAttendance.length}`);
    if (marchAttendance.length > 0) {
      marchAttendance.forEach(a => {
        console.log(
          `- Session ${a.session_id} (${a.session_date}): Student ${a.student_id} - ${a.status}`
        );
      });
    } else {
      console.log("(No attendance records found for March 2026 sessions)");
    }

    console.log("\n========== SUMMARY ==========");
    console.log("✓ Schema check completed");
    console.log(`- session_date column: PostgreSQL DATE type (YYYY-MM-DD format)`);
    console.log(
      `- Total training sessions: ${stats[0].total_sessions}`
    );
    console.log(
      `- Total attendance records: ${stats[0].total_attendance}`
    );
    console.log(`- March 2026 sessions: ${marchSessions.length}`);
    console.log(`- March 2026 attendance: ${marchAttendance.length}`);

  } catch (error) {
    console.error("Error querying database:", error.message);
    process.exit(1);
  }
  process.exit(0);
}

checkData();
