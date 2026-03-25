"use server";

import { db } from "@/db";
import { evaluations, students, attendance, trainingSessions } from "@/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// New 4-criteria evaluation system (/50 total):
// 1️⃣ الانضباطية (15): تنفيذ تعليمات المدرب
// 2️⃣ الأخلاق (15): احترام (10) + اللعب النظيف (5)
// 3️⃣ المستوى الفني (20): التطور المهاري والأداء البدني
interface CreateEvaluationInput {
  studentId: string;
  month: number;
  year: number;
  // 1️⃣ الانضباطية – 15 درجة
  coachInstructions: number; // تنفيذ تعليمات المدرب (1-15)
  // 2️⃣ الأخلاق – 15 درجة
  respectScore: number; // احترام المدربين والإدارة والزملاء (1-10)
  fairPlayScore: number; // اللعب النظيف والروح الرياضية (1-5)
  // 3️⃣ المستوى الفني – 20 درجة
  technicalProgress: number; // التطور المهاري والأداء البدني (1-20)
  notes?: string;
}

export async function createEvaluation(input: CreateEvaluationInput) {
  try {
    // Check for duplicate
    const existing = await db.select().from(evaluations)
      .where(and(
        eq(evaluations.studentId, input.studentId),
        eq(evaluations.month, input.month),
        eq(evaluations.year, input.year)
      ));

    if (existing.length > 0) {
      return { success: false, error: "يوجد تقييم لهذا الشهر بالفعل" };
    }

    // Calculate grand total (15 + 10 + 5 + 20 = 50)
    const grandTotal = input.coachInstructions + input.respectScore + input.fairPlayScore + input.technicalProgress;

    const [evaluation] = await db.insert(evaluations).values({
      studentId: input.studentId,
      month: input.month,
      year: input.year,
      coachInstructions: input.coachInstructions,
      respectScore: input.respectScore,
      fairPlayScore: input.fairPlayScore,
      technicalProgress: input.technicalProgress,
      grandTotal,
      notes: input.notes,
    }).returning();

    revalidatePath(`/students/${input.studentId}`);
    revalidatePath("/evaluations");
    return { success: true, evaluation };
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return { success: false, error: "فشل في حفظ التقييم" };
  }
}

export async function updateEvaluation(id: string, input: Partial<CreateEvaluationInput>) {
  try {
    const updateData: Record<string, unknown> = { ...input, updatedAt: new Date() };
    
    // Recalculate grandTotal if any score field is present
    if (input.coachInstructions !== undefined || input.respectScore !== undefined || 
        input.fairPlayScore !== undefined || input.technicalProgress !== undefined) {
      const [existing] = await db.select().from(evaluations).where(eq(evaluations.id, id));
      if (existing) {
        const merged = {
          coachInstructions: input.coachInstructions ?? existing.coachInstructions ?? 0,
          respectScore: input.respectScore ?? existing.respectScore ?? 0,
          fairPlayScore: input.fairPlayScore ?? existing.fairPlayScore ?? 0,
          technicalProgress: input.technicalProgress ?? existing.technicalProgress ?? 0,
        };
        updateData.grandTotal = merged.coachInstructions + merged.respectScore + merged.fairPlayScore + merged.technicalProgress;
      }
    }

    const [updated] = await db.update(evaluations).set(updateData)
      .where(eq(evaluations.id, id)).returning();

    if (updated) {
      revalidatePath(`/students/${updated.studentId}`);
      revalidatePath("/evaluations");
    }
    return { success: true, evaluation: updated };
  } catch (error) {
    console.error("Error updating evaluation:", error);
    return { success: false, error: "فشل في تحديث التقييم" };
  }
}

export async function getStudentEvaluations(studentId: string) {
  try {
    const evals = await db.select().from(evaluations)
      .where(eq(evaluations.studentId, studentId))
      .orderBy(desc(evaluations.year), desc(evaluations.month));

    return { success: true, evaluations: evals };
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return { success: false, error: "فشل في جلب التقييمات" };
  }
}

export async function getEvaluation(id: string) {
  try {
    const [evaluation] = await db.select().from(evaluations)
      .where(eq(evaluations.id, id));

    if (!evaluation) {
      return { success: false, error: "التقييم غير موجود" };
    }

    return { success: true, evaluation };
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    return { success: false, error: "فشل في جلب التقييم" };
  }
}

export async function deleteEvaluation(id: string) {
  try {
    const [deleted] = await db.delete(evaluations)
      .where(eq(evaluations.id, id)).returning();

    if (deleted) {
      revalidatePath(`/students/${deleted.studentId}`);
      revalidatePath("/evaluations");
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    return { success: false, error: "فشل في حذف التقييم" };
  }
}

// Get students with attendance in the selected month for evaluations page
export async function getStudentsWithEvaluations(month: number, year: number) {
  try {
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]; // YYYY-MM-01
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // YYYY-MM-31 (or 30, 29, 28)

    // Get students who have attendance in the selected month (using subquery EXISTS)
    const studentList = await db
      .select({ id: students.id, name: students.name, ageGroup: students.ageGroup })
      .from(students)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${attendance}
          INNER JOIN ${trainingSessions} ON ${attendance.sessionId} = ${trainingSessions.id}
          WHERE ${attendance.studentId} = ${students.id}
          AND ${trainingSessions.sessionDate} BETWEEN ${startDate} AND ${endDate}
          LIMIT 1
        )`
      )
      .orderBy(students.name);

    // Get evaluations for this month
    const monthEvals = await db
      .select()
      .from(evaluations)
      .where(and(eq(evaluations.month, month), eq(evaluations.year, year)));

    const evalMap = new Map(monthEvals.map(e => [e.studentId, e]));

    // Map students with their evaluations
    const studentsWithEval = studentList.map(s => ({
      id: s.id,
      name: s.name,
      ageGroup: s.ageGroup,
      evaluation: evalMap.get(s.id) || null,
    }));

    return {
      success: true,
      students: studentsWithEval,
      evaluatedCount: monthEvals.length,
      totalCount: studentsWithEval.length,
    };
  } catch (error) {
    console.error("Error fetching students with evaluations:", error);
    return { success: false, error: "فشل في جلب البيانات" };
  }
}
