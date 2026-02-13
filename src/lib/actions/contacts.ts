"use server";

import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateContactInput {
  studentId: string;
  name: string;
  relation?: "father" | "mother" | "guardian" | "other";
  phone: string;
  email?: string;
  isPrimaryPayer?: boolean;
  telegramId?: string;
}

export async function createContact(input: CreateContactInput) {
  try {
    const [newContact] = await db.insert(contacts).values({
      studentId: input.studentId,
      name: input.name,
      relation: input.relation,
      phone: input.phone,
      email: input.email,
      isPrimaryPayer: input.isPrimaryPayer || false,
      telegramId: input.telegramId,
    }).returning();

    return { success: true, contact: newContact };
  } catch (error) {
    console.error("Error creating contact:", error);
    return { success: false, error: "فشل في إضافة جهة الاتصال" };
  }
}

export async function deleteContact(contactId: string) {
  try {
    await db.delete(contacts).where(eq(contacts.id, contactId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting contact:", error);
    return { success: false, error: "فشل في حذف جهة الاتصال" };
  }
}

export async function getContactsByStudentId(studentId: string) {
  try {
    const studentContacts = await db.select()
      .from(contacts)
      .where(eq(contacts.studentId, studentId));
    return { success: true, contacts: studentContacts };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return { success: false, contacts: [], error: "فشل في تحميل جهات الاتصال" };
  }
}
