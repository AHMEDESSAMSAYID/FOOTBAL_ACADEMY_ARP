"use server";

import { createClerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserRole } from "@/lib/auth";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Get all coaches from the database.
 */
export async function getCoaches() {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return { success: false, error: "غير مصرح" };
  }

  const coaches = await db
    .select()
    .from(users)
    .where(eq(users.role, "coach"));

  return { success: true, coaches };
}

/**
 * Get all users from the database.
 */
export async function getAllUsers() {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return { success: false, error: "غير مصرح" };
  }

  const allUsers = await db.select().from(users);
  return { success: true, users: allUsers };
}

/**
 * Invite/create a coach account.
 * Creates a Clerk user + DB record with role='coach'.
 */
export async function createCoach(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return { success: false, error: "غير مصرح - فقط المدير يمكنه إضافة مدربين" };
  }

  try {
    // Create Clerk user
    const clerkUser = await clerk.users.createUser({
      emailAddress: [data.email],
      password: data.password,
      firstName: data.name,
      phoneNumber: data.phone ? [data.phone] : undefined,
    });

    // Create DB record with coach role
    const [coach] = await db
      .insert(users)
      .values({
        clerkId: clerkUser.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: "coach",
      })
      .returning();

    return { success: true, coach };
  } catch (error: unknown) {
    console.error("Error creating coach:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء حساب المدرب";
    return { success: false, error: message };
  }
}

/**
 * Delete a coach account (removes from Clerk + DB).
 */
export async function deleteCoach(userId: string) {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return { success: false, error: "غير مصرح" };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "المستخدم غير موجود" };
    }

    if (user.role !== "coach") {
      return { success: false, error: "لا يمكن حذف حساب مدير" };
    }

    // Delete from Clerk
    try {
      await clerk.users.deleteUser(user.clerkId);
    } catch {
      // User might already be deleted from Clerk
    }

    // Delete from DB
    await db.delete(users).where(eq(users.id, userId));

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting coach:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء حذف المدرب";
    return { success: false, error: message };
  }
}

/**
 * Toggle coach active status.
 */
export async function toggleCoachStatus(userId: string) {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return { success: false, error: "غير مصرح" };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "المستخدم غير موجود" };
    }

    const [updated] = await db
      .update(users)
      .set({ isActive: !user.isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return { success: true, user: updated };
  } catch (error: unknown) {
    console.error("Error toggling coach status:", error);
    return { success: false, error: "حدث خطأ" };
  }
}
