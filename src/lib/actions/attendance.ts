"use server";

import { db } from "@/db";
import { trainingSessions, attendance, students } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Story 5-2: Create Training Session
interface CreateSessionInput {
  date: string;
  ageGroup: "5-10" | "10-15" | "15+";
  notes?: string;
}

export async function createTrainingSession(input: CreateSessionInput) {
  try {
    // Check if session already exists for this date and age group
    const existing = await db.query.trainingSessions.findFirst({
      where: and(
        eq(trainingSessions.sessionDate, input.date),
        eq(trainingSessions.ageGroup, input.ageGroup)
      ),
    });

    if (existing) {
      return { success: false, error: "يوجد تدريب مسجل لهذا اليوم والفئة العمرية" };
    }

    const [session] = await db.insert(trainingSessions).values({
      sessionDate: input.date,
      ageGroup: input.ageGroup,
      notes: input.notes,
    }).returning();

    revalidatePath("/attendance");
    return { success: true, session };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: "فشل في إنشاء التدريب" };
  }
}

// Story 5-3: Mark Attendance
interface MarkAttendanceInput {
  sessionId: string;
  studentId: string;
  status: "present" | "absent" | "excused";
  notes?: string;
}

export async function markAttendance(input: MarkAttendanceInput) {
  try {
    // Check if attendance already exists
    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.sessionId, input.sessionId),
        eq(attendance.studentId, input.studentId)
      ),
    });

    if (existing) {
      // Update existing
      await db.update(attendance)
        .set({
          status: input.status,
          notes: input.notes,
        })
        .where(eq(attendance.id, existing.id));
    } else {
      // Create new
      await db.insert(attendance).values({
        sessionId: input.sessionId,
        studentId: input.studentId,
        status: input.status,
        notes: input.notes,
      });
    }

    revalidatePath("/attendance");
    return { success: true };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return { success: false, error: "فشل في تسجيل الحضور" };
  }
}

// Batch mark attendance for multiple students
interface BatchMarkAttendanceInput {
  sessionId: string;
  records: {
    studentId: string;
    status: "present" | "absent" | "excused";
    notes?: string;
  }[];
}

export async function batchMarkAttendance(input: BatchMarkAttendanceInput) {
  try {
    for (const record of input.records) {
      await markAttendance({
        sessionId: input.sessionId,
        ...record,
      });
    }
    
    revalidatePath("/attendance");
    return { success: true };
  } catch (error) {
    console.error("Error batch marking attendance:", error);
    return { success: false, error: "فشل في تسجيل الحضور" };
  }
}

// Get sessions with attendance data
export async function getSessions(limit: number = 30) {
  try {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .orderBy(desc(trainingSessions.sessionDate))
      .limit(limit);
    
    return { success: true, sessions };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return { success: false, sessions: [], error: "فشل في تحميل التدريبات" };
  }
}

// Get session with attendance records
export async function getSessionAttendance(sessionId: string) {
  try {
    const session = await db.query.trainingSessions.findFirst({
      where: eq(trainingSessions.id, sessionId),
    });

    if (!session) {
      return { success: false, error: "التدريب غير موجود" };
    }

    // Get all attendance records for this session
    const attendanceRecords = await db
      .select({
        attendance,
        student: students,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(eq(attendance.sessionId, sessionId));

    // Get all students in this age group
    let ageGroupStudents: typeof students.$inferSelect[] = [];
    if (session.ageGroup) {
      ageGroupStudents = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.ageGroup, session.ageGroup),
            eq(students.status, "active")
          )
        )
        .orderBy(students.name);
    } else {
      // If no age group, get all active students
      ageGroupStudents = await db
        .select()
        .from(students)
        .where(eq(students.status, "active"))
        .orderBy(students.name);
    }

    return { 
      success: true, 
      session, 
      attendanceRecords,
      ageGroupStudents,
    };
  } catch (error) {
    console.error("Error fetching session attendance:", error);
    return { success: false, error: "فشل في تحميل بيانات الحضور" };
  }
}

// Get student attendance history
export async function getStudentAttendance(studentId: string) {
  try {
    const records = await db
      .select({
        attendance,
        session: trainingSessions,
      })
      .from(attendance)
      .innerJoin(trainingSessions, eq(attendance.sessionId, trainingSessions.id))
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(trainingSessions.sessionDate))
      .limit(30);

    // Calculate stats
    const present = records.filter(r => r.attendance.status === "present").length;
    const absent = records.filter(r => r.attendance.status === "absent").length;
    const excused = records.filter(r => r.attendance.status === "excused").length;
    const total = records.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { 
      success: true, 
      records,
      stats: { present, absent, excused, total, attendanceRate },
    };
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return { success: false, records: [], stats: { present: 0, absent: 0, excused: 0, total: 0, attendanceRate: 0 }, error: "فشل في تحميل سجل الحضور" };
  }
}
