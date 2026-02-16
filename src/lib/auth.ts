"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// Core admin email — auto-created as admin on first sign-in
const CORE_ADMIN_EMAIL = "espanyolacademy10@gmail.com";

/**
 * Get the current user's role from the database.
 * Only the core admin email auto-creates. Everyone else must be pre-invited.
 */
export async function getCurrentUserRole(): Promise<{
  role: "admin" | "coach";
  userId: string;
  clerkId: string;
  userName: string;
}> {
  const clerk = await currentUser();
  if (!clerk) {
    redirect("/sign-in");
  }

  const email = clerk.emailAddresses[0]?.emailAddress || "";

  // Look up user in DB
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerk.id))
    .limit(1);

  if (existing.length > 0) {
    return {
      role: existing[0].role as "admin" | "coach",
      userId: existing[0].id,
      clerkId: clerk.id,
      userName: existing[0].name,
    };
  }

  // Only the core admin can auto-create on first sign-in
  if (email.toLowerCase() === CORE_ADMIN_EMAIL) {
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: clerk.id,
        name: clerk.firstName || email,
        email,
        phone: clerk.phoneNumbers[0]?.phoneNumber || null,
        role: "admin",
      })
      .returning();

    return {
      role: newUser.role as "admin" | "coach",
      userId: newUser.id,
      clerkId: clerk.id,
      userName: newUser.name,
    };
  }

  // Check if the user was pre-created by email (invited by admin via createCoach/createAdmin)
  const preCreated = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (preCreated.length > 0 && !preCreated[0].clerkId) {
    // Link the Clerk account to the pre-created DB record
    const [updated] = await db
      .update(users)
      .set({ clerkId: clerk.id })
      .where(eq(users.id, preCreated[0].id))
      .returning();

    return {
      role: updated.role as "admin" | "coach",
      userId: updated.id,
      clerkId: clerk.id,
      userName: updated.name,
    };
  }

  // Not invited — deny access
  redirect("/sign-in?error=not-invited");
}
