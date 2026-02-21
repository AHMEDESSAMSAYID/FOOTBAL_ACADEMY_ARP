"use server";

import { db } from "@/db";
import { students } from "@/db/schema";
import { eq, sql, isNull, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Generate next sequential code: ESP-001, ESP-002, etc. */
async function generateNextCode(): Promise<string> {
  // Find the highest existing sequential code
  const result = await db
    .select({ num: sql<string>`membership_number` })
    .from(students)
    .where(like(students.membershipNumber, "ESP-%"));
  
  let maxNum = 0;
  for (const row of result) {
    const match = row.num?.match(/^ESP-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  
  const next = maxNum + 1;
  return `ESP-${String(next).padStart(3, "0")}`;
}

/** Backfill sequential codes for all students that have non-sequential or missing codes */
export async function backfillStudentCodes() {
  const allStudents = await db
    .select({ id: students.id, membershipNumber: students.membershipNumber, createdAt: students.createdAt })
    .from(students)
    .orderBy(students.createdAt);
  
  // Find currently highest sequential number
  let maxNum = 0;
  for (const s of allStudents) {
    const match = s.membershipNumber?.match(/^ESP-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  
  // Assign new sequential codes to students without proper ones
  let updated = 0;
  for (const s of allStudents) {
    const isSequential = s.membershipNumber?.match(/^ESP-\d{3,}$/);
    if (!isSequential) {
      maxNum++;
      const newCode = `ESP-${String(maxNum).padStart(3, "0")}`;
      await db
        .update(students)
        .set({ membershipNumber: newCode })
        .where(eq(students.id, s.id));
      updated++;
    }
  }
  
  revalidatePath("/students");
  return { success: true, updated };
}

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
  registrationDate?: string;
  registrationFormStatus?: "filled" | "not_filled";
  registrationFormNotes?: string;
}

export async function createStudent(input: CreateStudentInput) {
  try {
    // Generate sequential membership number ESP-001, ESP-002, ...
    const membershipNumber = await generateNextCode();
    
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
      registrationDate: input.registrationDate || new Date().toISOString().split("T")[0],
      registrationFormStatus: input.registrationFormStatus || "not_filled",
      registrationFormNotes: input.registrationFormNotes,
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

// Toggle registration form status
export async function updateRegistrationFormStatus(
  studentId: string,
  status: "filled" | "not_filled"
) {
  try {
    await db
      .update(students)
      .set({ registrationFormStatus: status, updatedAt: new Date() })
      .where(eq(students.id, studentId));
    
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating registration form status:", error);
    return { success: false, error: "فشل في تحديث حالة الاستمارة" };
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
  registrationDate?: string;
  registrationFormStatus?: "filled" | "not_filled";
  registrationFormNotes?: string;
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
        registrationDate: input.registrationDate || undefined,
        registrationFormStatus: input.registrationFormStatus || undefined,
        registrationFormNotes: input.registrationFormNotes ?? undefined,
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
