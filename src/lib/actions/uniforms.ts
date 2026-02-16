"use server";

import { db } from "@/db";
import { uniformRecords, students } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ===== Create Uniform Record =====

interface CreateUniformInput {
  studentId: string;
  uniformType: "red" | "navy";
  givenDate: string;
  price: number;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
}

export async function createUniformRecord(input: CreateUniformInput) {
  try {
    await db.insert(uniformRecords).values({
      studentId: input.studentId,
      uniformType: input.uniformType,
      givenDate: input.givenDate,
      price: input.price.toString(),
      isPaid: input.isPaid,
      paidDate: input.isPaid ? (input.paidDate || input.givenDate) : null,
      notes: input.notes || null,
    });

    revalidatePath(`/students/${input.studentId}`);
    revalidatePath("/payments");
    return { success: true };
  } catch (error) {
    console.error("Error creating uniform record:", error);
    return { success: false, error: "فشل في إضافة سجل الزي" };
  }
}

// ===== Update Uniform Record =====

interface UpdateUniformInput {
  id: string;
  studentId: string;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
}

export async function updateUniformRecord(input: UpdateUniformInput) {
  try {
    await db.update(uniformRecords).set({
      isPaid: input.isPaid,
      paidDate: input.isPaid ? (input.paidDate || new Date().toISOString().split("T")[0]) : null,
      notes: input.notes || null,
      updatedAt: new Date(),
    }).where(eq(uniformRecords.id, input.id));

    revalidatePath(`/students/${input.studentId}`);
    revalidatePath("/payments");
    return { success: true };
  } catch (error) {
    console.error("Error updating uniform record:", error);
    return { success: false, error: "فشل في تحديث سجل الزي" };
  }
}

// ===== Delete Uniform Record =====

export async function deleteUniformRecord(id: string, studentId: string) {
  try {
    await db.delete(uniformRecords).where(eq(uniformRecords.id, id));
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/payments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting uniform record:", error);
    return { success: false, error: "فشل في حذف سجل الزي" };
  }
}

// ===== Get Uniform Records for a Student =====

export async function getUniformRecords(studentId: string) {
  try {
    const records = await db
      .select()
      .from(uniformRecords)
      .where(eq(uniformRecords.studentId, studentId))
      .orderBy(desc(uniformRecords.givenDate));
    return { success: true, records };
  } catch (error) {
    console.error("Error fetching uniform records:", error);
    return { success: false, error: "فشل في جلب سجلات الزي", records: [] };
  }
}

// ===== Get All Unpaid Uniforms (for alerts) =====

export async function getUnpaidUniforms() {
  try {
    const records = await db
      .select({
        uniform: uniformRecords,
        student: students,
      })
      .from(uniformRecords)
      .innerJoin(students, eq(uniformRecords.studentId, students.id))
      .where(eq(uniformRecords.isPaid, false))
      .orderBy(desc(uniformRecords.givenDate));
    return { success: true, records };
  } catch (error) {
    console.error("Error fetching unpaid uniforms:", error);
    return { success: false, error: "فشل في جلب الزي غير المدفوع", records: [] };
  }
}
