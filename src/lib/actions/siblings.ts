"use server";

import { db } from "@/db";
import { students, contacts } from "@/db/schema";
import { eq, ne, and, or, like, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Search students by name for sibling linking
 */
export async function searchStudents(query: string, excludeId?: string) {
  try {
    if (!query || query.length < 2) return { success: true, students: [] };

    const results = await db
      .select({
        id: students.id,
        name: students.name,
        fullName: students.fullName,
        membershipNumber: students.membershipNumber,
        siblingGroupId: students.siblingGroupId,
        status: students.status,
      })
      .from(students)
      .where(
        and(
          or(
            like(students.name, `%${query}%`),
            like(students.fullName, `%${query}%`)
          ),
          excludeId ? ne(students.id, excludeId) : undefined
        )
      )
      .limit(10);

    return { success: true, students: results };
  } catch (error) {
    console.error("Error searching students:", error);
    return { success: false, students: [] };
  }
}

/**
 * Link two students as siblings.
 * - If neither has a siblingGroupId, create a new group.
 * - If one has a group, add the other to it.
 * - If both have groups, merge into one group.
 */
export async function linkSiblings(studentId1: string, studentId2: string) {
  try {
    const [s1] = await db.select({ id: students.id, siblingGroupId: students.siblingGroupId })
      .from(students).where(eq(students.id, studentId1));
    const [s2] = await db.select({ id: students.id, siblingGroupId: students.siblingGroupId })
      .from(students).where(eq(students.id, studentId2));

    if (!s1 || !s2) return { success: false, error: "لم يتم العثور على اللاعب" };
    if (s1.id === s2.id) return { success: false, error: "لا يمكن ربط اللاعب بنفسه" };

    let groupId: string;

    if (s1.siblingGroupId && s2.siblingGroupId) {
      // Both have groups — merge s2's group into s1's group
      groupId = s1.siblingGroupId;
      await db.update(students)
        .set({ siblingGroupId: groupId, updatedAt: new Date() })
        .where(eq(students.siblingGroupId, s2.siblingGroupId));
    } else if (s1.siblingGroupId) {
      // Only s1 has a group — add s2
      groupId = s1.siblingGroupId;
      await db.update(students)
        .set({ siblingGroupId: groupId, updatedAt: new Date() })
        .where(eq(students.id, studentId2));
    } else if (s2.siblingGroupId) {
      // Only s2 has a group — add s1
      groupId = s2.siblingGroupId;
      await db.update(students)
        .set({ siblingGroupId: groupId, updatedAt: new Date() })
        .where(eq(students.id, studentId1));
    } else {
      // Neither has a group — create new
      groupId = `SG-${Date.now()}`;
      await db.update(students)
        .set({ siblingGroupId: groupId, updatedAt: new Date() })
        .where(or(eq(students.id, studentId1), eq(students.id, studentId2)));
    }

    revalidatePath(`/students/${studentId1}`);
    revalidatePath(`/students/${studentId2}`);
    revalidatePath("/students");

    return { success: true, groupId };
  } catch (error) {
    console.error("Error linking siblings:", error);
    return { success: false, error: "فشل في ربط الأخوة" };
  }
}

/**
 * Remove a student from their sibling group.
 * If only one student remains in the group, clear their groupId too.
 */
export async function unlinkSibling(studentId: string) {
  try {
    const [student] = await db.select({ siblingGroupId: students.siblingGroupId })
      .from(students).where(eq(students.id, studentId));

    if (!student?.siblingGroupId) {
      return { success: false, error: "اللاعب ليس في مجموعة أخوة" };
    }

    const groupId = student.siblingGroupId;

    // Remove this student from the group
    await db.update(students)
      .set({ siblingGroupId: null, updatedAt: new Date() })
      .where(eq(students.id, studentId));

    // Check remaining members
    const remaining = await db.select({ id: students.id })
      .from(students)
      .where(eq(students.siblingGroupId, groupId));

    // If only 1 left, remove their groupId too (no longer a "group")
    if (remaining.length === 1) {
      await db.update(students)
        .set({ siblingGroupId: null, updatedAt: new Date() })
        .where(eq(students.id, remaining[0].id));
      revalidatePath(`/students/${remaining[0].id}`);
    }

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");

    return { success: true };
  } catch (error) {
    console.error("Error unlinking sibling:", error);
    return { success: false, error: "فشل في فك ربط الأخوة" };
  }
}

/**
 * Get all siblings of a student (excluding the student themselves).
 */
export async function getSiblings(studentId: string) {
  try {
    const [student] = await db.select({ siblingGroupId: students.siblingGroupId })
      .from(students).where(eq(students.id, studentId));

    if (!student?.siblingGroupId) {
      return { success: true, siblings: [] };
    }

    const siblings = await db
      .select({
        id: students.id,
        name: students.name,
        membershipNumber: students.membershipNumber,
        status: students.status,
        ageGroup: students.ageGroup,
      })
      .from(students)
      .where(
        and(
          eq(students.siblingGroupId, student.siblingGroupId),
          ne(students.id, studentId)
        )
      );

    return { success: true, siblings };
  } catch (error) {
    console.error("Error fetching siblings:", error);
    return { success: false, siblings: [] };
  }
}

/**
 * Auto-detect potential siblings by matching parent phone numbers.
 * Returns students who share a contact phone with the given student.
 */
export async function detectSiblingsByPhone(studentId: string) {
  try {
    // Get this student's contact phones
    const studentContacts = await db.select({ phone: contacts.phone })
      .from(contacts)
      .where(eq(contacts.studentId, studentId));

    if (studentContacts.length === 0) {
      return { success: true, potentialSiblings: [] };
    }

    const phones = studentContacts.map((c) => c.phone);

    // Find other students whose contacts share the same phone
    const matchingContacts = await db
      .select({
        studentId: contacts.studentId,
        phone: contacts.phone,
      })
      .from(contacts)
      .where(
        and(
          ne(contacts.studentId, studentId),
          or(...phones.map((p) => eq(contacts.phone, p)))
        )
      );

    if (matchingContacts.length === 0) {
      return { success: true, potentialSiblings: [] };
    }

    const siblingIds = [...new Set(matchingContacts.map((c) => c.studentId))];

    const potentialSiblings = await db
      .select({
        id: students.id,
        name: students.name,
        membershipNumber: students.membershipNumber,
        status: students.status,
        siblingGroupId: students.siblingGroupId,
      })
      .from(students)
      .where(or(...siblingIds.map((sid) => eq(students.id, sid))));

    return { success: true, potentialSiblings };
  } catch (error) {
    console.error("Error detecting siblings:", error);
    return { success: false, potentialSiblings: [] };
  }
}
