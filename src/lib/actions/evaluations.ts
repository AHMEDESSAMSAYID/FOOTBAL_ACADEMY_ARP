"use server";

import { db } from "@/db";
import { evaluations, students } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateEvaluationInput {
  studentId: string;
  month: number;
  year: number;
  // Technical
  ballControl: number;
  passing: number;
  shooting: number;
  // Physical
  speed: number;
  fitness: number;
  // Tactical
  positioning: number;
  gameAwareness: number;
  // Attitude
  commitment: number;
  teamwork: number;
  discipline: number;
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

    const grandTotal = input.ballControl + input.passing + input.shooting
      + input.speed + input.fitness
      + input.positioning + input.gameAwareness
      + input.commitment + input.teamwork + input.discipline;

    const [evaluation] = await db.insert(evaluations).values({
      studentId: input.studentId,
      month: input.month,
      year: input.year,
      ballControl: input.ballControl,
      passing: input.passing,
      shooting: input.shooting,
      speed: input.speed,
      fitness: input.fitness,
      positioning: input.positioning,
      gameAwareness: input.gameAwareness,
      commitment: input.commitment,
      teamwork: input.teamwork,
      discipline: input.discipline,
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
    if (input.ballControl !== undefined || input.passing !== undefined) {
      // Need full record to recalculate
      const [existing] = await db.select().from(evaluations).where(eq(evaluations.id, id));
      if (existing) {
        const merged = { ...existing, ...input };
        updateData.grandTotal = merged.ballControl + merged.passing + merged.shooting
          + merged.speed + merged.fitness
          + merged.positioning + merged.gameAwareness
          + merged.commitment + merged.teamwork + merged.discipline;
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

// Get all students with their latest evaluation for the evaluations page
export async function getStudentsWithEvaluations(month: number, year: number) {
  try {
    const activeStudents = await db
      .select({ id: students.id, name: students.name, ageGroup: students.ageGroup })
      .from(students)
      .where(eq(students.status, "active"))
      .orderBy(students.name);

    const monthEvals = await db
      .select()
      .from(evaluations)
      .where(and(eq(evaluations.month, month), eq(evaluations.year, year)));

    const evalMap = new Map(monthEvals.map(e => [e.studentId, e]));

    return {
      success: true,
      students: activeStudents.map(s => ({
        ...s,
        evaluation: evalMap.get(s.id) || null,
      })),
      evaluatedCount: monthEvals.length,
      totalCount: activeStudents.length,
    };
  } catch (error) {
    console.error("Error fetching students with evaluations:", error);
    return { success: false, error: "فشل في جلب البيانات" };
  }
}
