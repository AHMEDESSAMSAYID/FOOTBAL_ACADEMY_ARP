"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

  const email = (clerk.emailAddresses[0]?.emailAddress || "").toLowerCase().trim();

  // 1. Look up user in DB by clerkId (fast path — already linked)
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

  // 2. Look up by email (case-insensitive) — link clerkId on first sign-in
  const byEmail = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (byEmail.length > 0) {
    // Link the Clerk account to the existing DB record
    const [updated] = await db
      .update(users)
      .set({
        clerkId: clerk.id,
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, byEmail[0].id))
      .returning();

    return {
      role: updated.role as "admin" | "coach",
      userId: updated.id,
      clerkId: clerk.id,
      userName: updated.name,
    };
  }

  // 3. Core admin auto-create on first sign-in
  if (email === CORE_ADMIN_EMAIL) {
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

  // 4. Not invited — redirect to not-authorized page (signs them out)
  redirect("/not-authorized");
}
