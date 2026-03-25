"use server";

import { db } from "@/db";
import { parentEvaluations, students, surveys, attendance, trainingSessions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

const MONTH_NAMES: Record<number, string> = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
};

// ===== Admin: Create or get monthly survey link =====
export async function createMonthlySurvey(month: number, year: number) {
  try {
    // Check if survey already exists
    const existing = await db.query.surveys.findFirst({
      where: and(eq(surveys.month, month), eq(surveys.year, year)),
    });

    if (existing) {
      return { success: true, survey: existing, alreadyExists: true };
    }

    const token = generateToken();
    const title = `تقييم شهر ${MONTH_NAMES[month]} ${year}`;

    const [survey] = await db.insert(surveys).values({
      title, month, year, token,
    }).returning();

    revalidatePath("/reports");
    return { success: true, survey, alreadyExists: false };
  } catch (error) {
    console.error("Error creating survey:", error);
    return { success: false, error: "فشل في إنشاء رابط التقييم" };
  }
}

// ===== Public: Get survey info by token =====
export async function getSurveyByToken(token: string) {
  try {
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.token, token),
    });

    if (!survey) {
      return { success: false, error: "الرابط غير صالح" };
    }

    if (!survey.isActive) {
      return { success: false, error: "هذا التقييم مغلق" };
    }

    // Get all students who have attendance in the survey's month/year
    // Create date range for the month
    const startDate = new Date(survey.year, survey.month - 1, 1).toISOString().split('T')[0]; // YYYY-MM-01
    const endDate = new Date(survey.year, survey.month, 0).toISOString().split('T')[0]; // YYYY-MM-31 (or 30, 29, 28)

    // Get students with attendance in the survey's month (boolean: yes/no)
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

    // Get already submitted student IDs for this survey
    const submittedEvals = await db
      .select({ studentId: parentEvaluations.studentId })
      .from(parentEvaluations)
      .where(
        and(
          eq(parentEvaluations.surveyId, survey.id),
          eq(parentEvaluations.isSubmitted, true),
        )
      );
    const submittedIds = new Set(submittedEvals.map(e => e.studentId));

    return {
      success: true,
      survey: {
        id: survey.id,
        title: survey.title,
        month: survey.month,
        year: survey.year,
        monthName: MONTH_NAMES[survey.month] || "",
      },
      students: studentList.map(s => ({
        id: s.id,
        name: s.name,
        ageGroup: s.ageGroup,
        alreadySubmitted: submittedIds.has(s.id),
      })),
    };
  } catch (error) {
    console.error("Error fetching survey:", error);
    return { success: false, error: "فشل في تحميل التقييم" };
  }
}

// ===== Public: Submit evaluation for a student =====
interface SubmitEvalInput {
  surveyToken: string;
  studentId: string;
  prayer: number;
  sleep: number;
  healthyEating: number;
  respectOthers: number;
  angerControl: number;
  prepareBag: number;
  organizePersonal: number;
  fulfillRequests: number;
  parentNotes?: string;
}

export async function submitParentEvaluation(input: SubmitEvalInput) {
  try {
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.token, input.surveyToken),
    });
    if (!survey) return { success: false, error: "الرابط غير صالح" };
    if (!survey.isActive) return { success: false, error: "هذا التقييم مغلق" };

    // Check if already submitted
    const existing = await db.query.parentEvaluations.findFirst({
      where: and(
        eq(parentEvaluations.surveyId, survey.id),
        eq(parentEvaluations.studentId, input.studentId),
        eq(parentEvaluations.isSubmitted, true),
      ),
    });
    if (existing) return { success: false, error: "تم إرسال تقييم هذا اللاعب مسبقاً" };

    const disciplineTotal = input.prayer + input.sleep + input.healthyEating;
    const moralsTotal = input.respectOthers + input.angerControl;
    const homeTotal = input.prepareBag + input.organizePersonal + input.fulfillRequests;
    const grandTotal = disciplineTotal + moralsTotal + homeTotal;

    await db.insert(parentEvaluations).values({
      surveyId: survey.id,
      studentId: input.studentId,
      month: survey.month,
      year: survey.year,
      prayer: input.prayer,
      sleep: input.sleep,
      healthyEating: input.healthyEating,
      respectOthers: input.respectOthers,
      angerControl: input.angerControl,
      prepareBag: input.prepareBag,
      organizePersonal: input.organizePersonal,
      fulfillRequests: input.fulfillRequests,
      disciplineTotal,
      moralsTotal,
      homeTotal,
      grandTotal,
      parentNotes: input.parentNotes || null,
      isSubmitted: true,
      submittedAt: new Date(),
    });

    return { success: true, grandTotal };
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    return { success: false, error: "فشل في إرسال التقييم" };
  }
}

// ===== Admin: Get survey results =====
export async function getSurveyResults(month: number, year: number) {
  try {
    const survey = await db.query.surveys.findFirst({
      where: and(eq(surveys.month, month), eq(surveys.year, year)),
    });

    if (!survey) {
      return { success: true, data: null };
    }

    const evals = await db
      .select({ evaluation: parentEvaluations, student: students })
      .from(parentEvaluations)
      .innerJoin(students, eq(parentEvaluations.studentId, students.id))
      .where(and(
        eq(parentEvaluations.surveyId, survey.id),
        eq(parentEvaluations.isSubmitted, true),
      ))
      .orderBy(students.name);

    const count = evals.length;
    const avg = (fn: (e: typeof evals[0]) => number) =>
      count > 0 ? Math.round(evals.reduce((s, e) => s + fn(e), 0) / count * 10) / 10 : 0;

    const allActive = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.status, "active"));

    return {
      success: true,
      data: {
        surveyToken: survey.token,
        totalActive: allActive.length,
        submittedCount: count,
        averages: {
          discipline: avg(e => e.evaluation.disciplineTotal || 0),
          morals: avg(e => e.evaluation.moralsTotal || 0),
          home: avg(e => e.evaluation.homeTotal || 0),
          total: avg(e => e.evaluation.grandTotal || 0),
        },
        results: evals.map(e => ({
          studentId: e.student.id,
          studentName: e.student.name,
          ageGroup: e.student.ageGroup,
          disciplineTotal: e.evaluation.disciplineTotal,
          moralsTotal: e.evaluation.moralsTotal,
          homeTotal: e.evaluation.homeTotal,
          grandTotal: e.evaluation.grandTotal,
          prayer: e.evaluation.prayer,
          sleep: e.evaluation.sleep,
          healthyEating: e.evaluation.healthyEating,
          respectOthers: e.evaluation.respectOthers,
          angerControl: e.evaluation.angerControl,
          prepareBag: e.evaluation.prepareBag,
          organizePersonal: e.evaluation.organizePersonal,
          fulfillRequests: e.evaluation.fulfillRequests,
          parentNotes: e.evaluation.parentNotes,
          submittedAt: e.evaluation.submittedAt,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching results:", error);
    return { success: false, error: "فشل في تحميل النتائج" };
  }
}
