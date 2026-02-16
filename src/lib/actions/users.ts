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
 * Invite a user (admin or coach) via Clerk invitation.
 * Sends an email invitation — user sets their own password.
 * Pre-creates a DB record with role (clerkId linked on first sign-in).
 */
export async function createCoach(data: {
  name: string;
  email: string;
  phone?: string;
  role?: "admin" | "coach";
}) {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return { success: false, error: "غير مصرح - فقط المدير يمكنه إضافة مستخدمين" };
  }

  const targetRole = data.role || "coach";

  try {
    // Check if email already exists in DB
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    if (existingUser.length > 0) {
      return { success: false, error: "هذا البريد الإلكتروني مسجل بالفعل" };
    }

    // Send Clerk invitation email
    await clerk.invitations.createInvitation({
      emailAddress: data.email,
      redirectUrl: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/sign-up",
      ignoreExisting: true,
    });

    // Pre-create DB record (clerkId will be linked on first sign-in)
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone?.trim() || null,
        role: targetRole,
      })
      .returning();

    return { success: true, coach: newUser };
  } catch (error: unknown) {
    console.error("Error inviting user:", error);
    // Extract Clerk-specific error messages
    let message = "حدث خطأ أثناء إرسال الدعوة";
    if (error && typeof error === "object" && "errors" in error) {
      const clerkErr = error as { errors: { message: string; longMessage?: string }[] };
      if (clerkErr.errors?.length > 0) {
        message = clerkErr.errors.map((e) => e.longMessage || e.message).join(", ");
      }
    } else if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}

/**
 * Delete a user account (removes from Clerk + DB).
 * Cannot delete the core admin or yourself.
 */
export async function deleteCoach(userId: string) {
  const { role, userId: currentUserId } = await getCurrentUserRole();
  if (role !== "admin") {
    return { success: false, error: "غير مصرح" };
  }

  if (userId === currentUserId) {
    return { success: false, error: "لا يمكنك حذف حسابك الخاص" };
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

    if (user.email === "espanyolacademy10@gmail.com") {
      return { success: false, error: "لا يمكن حذف حساب المدير الرئيسي" };
    }

    // Delete from Clerk (only if they've signed up)
    if (user.clerkId) {
      try {
        await clerk.users.deleteUser(user.clerkId);
      } catch {
        // User might already be deleted from Clerk
      }
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
