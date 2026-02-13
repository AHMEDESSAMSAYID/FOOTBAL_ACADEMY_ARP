"use server";

import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateStudentInput {
  name: string;
  fullName?: string;
  status: "active" | "inactive" | "frozen" | "trial";
  birthDate?: string;
  ageGroup?: "5-10" | "10-15" | "15+";
  nationality?: string;
  idNumber?: string;
  phone?: string;
  school?: string;
  address?: string;
  area?: string;
  notes?: string;
}

export async function createStudent(input: CreateStudentInput) {
  try {
    // Generate membership number
    const membershipNumber = `ESP-${Date.now().toString().slice(-6)}`;
    
    const [newStudent] = await db.insert(students).values({
      membershipNumber,
      name: input.name,
      fullName: input.fullName,
      status: input.status,
      birthDate: input.birthDate,
      ageGroup: input.ageGroup,
      nationality: input.nationality,
      idNumber: input.idNumber,
      phone: input.phone,
      school: input.school,
      address: input.address,
      area: input.area,
      notes: input.notes,
      registrationDate: new Date().toISOString().split("T")[0],
    }).returning();

    revalidatePath("/students");
    revalidatePath("/");

    return { success: true, student: newStudent };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error: "فشل في تسجيل اللاعب" };
  }
}

export async function getStudents() {
  try {
    const allStudents = await db.select().from(students).orderBy(students.name);
    return { success: true, students: allStudents };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, students: [], error: "فشل في تحميل قائمة اللاعبين" };
  }
}

// Story 2-6: Update Student Status
export async function updateStudentStatus(
  studentId: string, 
  status: "active" | "inactive" | "frozen" | "trial"
) {
  try {
    await db
      .update(students)
      .set({ status, updatedAt: new Date() })
      .where(eq(students.id, studentId));
    
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating student status:", error);
    return { success: false, error: "فشل في تحديث الحالة" };
  }
}

// Story 2-7: Assign Student Age Group
export async function updateStudentAgeGroup(
  studentId: string,
  ageGroup: "5-10" | "10-15" | "15+"
) {
  try {
    await db
      .update(students)
      .set({ ageGroup, updatedAt: new Date() })
      .where(eq(students.id, studentId));
    
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating student age group:", error);
    return { success: false, error: "فشل في تحديث الفئة العمرية" };
  }
}

// Update student full profile
interface UpdateStudentInput {
  name: string;
  fullName?: string;
  status: "active" | "inactive" | "frozen" | "trial";
  birthDate?: string;
  ageGroup?: "5-10" | "10-15" | "15+";
  nationality?: string;
  idNumber?: string;
  phone?: string;
  school?: string;
  address?: string;
  area?: string;
  notes?: string;
}

export async function updateStudent(studentId: string, input: UpdateStudentInput) {
  try {
    await db
      .update(students)
      .set({
        name: input.name,
        fullName: input.fullName || null,
        status: input.status,
        birthDate: input.birthDate || null,
        ageGroup: input.ageGroup || null,
        nationality: input.nationality || null,
        idNumber: input.idNumber || null,
        phone: input.phone || null,
        school: input.school || null,
        address: input.address || null,
        area: input.area || null,
        notes: input.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");

    return { success: true };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: "فشل في تحديث بيانات اللاعب" };
  }
}

// Story 2-8: Update Student Notes
export async function updateStudentNotes(studentId: string, notes: string) {
  try {
    await db
      .update(students)
      .set({ notes, updatedAt: new Date() })
      .where(eq(students.id, studentId));
    
    revalidatePath(`/students/${studentId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating student notes:", error);
    return { success: false, error: "فشل في حفظ الملاحظات" };
  }
}
