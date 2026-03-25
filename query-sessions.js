// Query script to check training sessions and attendance data
const { config } = require("dotenv");
config({ path: ".env.local" });

const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const schema = require("./src/db/schema");
const { sql } = require("drizzle-orm");

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function checkData() {
  try {
    // 1. Check training sessions - show actual date values
    console.log("\n========== TRAINING SESSIONS SAMPLE DATA ==========");
    const sessions = await db.select().from(schema.trainingSessions).limit(10);
    console.log(`Found ${sessions.length} training sessions`);
    console.log("Sample data from training_sessions table:");
    sessions.forEach(s => {
      console.log(`- Session ID: ${s.id}`);
      console.log(`  Date: ${s.sessionDate} (Type: ${typeof s.sessionDate})`);
      console.log(`  Day of Week: ${s.dayOfWeek}`);
      console.log(`  Age Group: ${s.ageGroup}`);
      console.log(`  Created: ${s.createdAt}\n`);
    });

    // 2. Check for March 2026 training sessions
    console.log("\n========== MARCH 2026 TRAINING SESSIONS ==========");
    const marchSessions = await db
      .select()
      .from(schema.trainingSessions)
      .where(
        sql`EXTRACT(year FROM ${schema.trainingSessions.sessionDate}) = 2026 AND EXTRACT(month FROM ${schema.trainingSessions.sessionDate}) = 3`
      );

    console.log(`Training sessions in March 2026: ${marchSessions.length}`);
    if (marchSessions.length > 0) {
      marchSessions.slice(0, 5).forEach(s => {
        console.log(`- ${s.sessionDate} (${s.dayOfWeek}, ${s.ageGroup})`);
      });
    }

    // 3. Check attendance linked to training sessions
    console.log("\n========== ATTENDANCE RECORDS ==========");
    const attendanceRecords = await db
      .select()
      .from(schema.attendance)
      .limit(10);
    console.log(`Total attendance records checked: ${attendanceRecords.length}`);

    if (attendanceRecords.length > 0) {
      console.log("Sample attendance records:");
      attendanceRecords.forEach(a => {
        console.log(`- Attendance ID: ${a.id}`);
        console.log(`  Session ID: ${a.sessionId}`);
        console.log(`  Student ID: ${a.studentId}`);
        console.log(`  Status: ${a.status}`);
        console.log(`  Created: ${a.createdAt}\n`);
      });
    } else {
      console.log("No attendance records found");
    }

    // 4. Check total counts
    console.log("\n========== DATABASE STATISTICS ==========");
    const totalSessions = await db
      .select({ count: sql`COUNT(*)` })
      .from(schema.trainingSessions);
    const totalAttendance = await db
      .select({ count: sql`COUNT(*)` })
      .from(schema.attendance);

    console.log(
      `Total training sessions in database: ${totalSessions[0]?.count || 0}`
    );
    console.log(
      `Total attendance records in database: ${totalAttendance[0]?.count || 0}`
    );

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
  process.exit(0);
}

checkData();
