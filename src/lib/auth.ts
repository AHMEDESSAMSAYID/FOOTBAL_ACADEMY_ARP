"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Get the current user's role from the database.
 * Creates the user record on first sign-in (defaults to admin).
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

  // First sign-in: create user record (defaults to admin)
  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: clerk.id,
      name: clerk.firstName || clerk.emailAddresses[0]?.emailAddress || "User",
      email: clerk.emailAddresses[0]?.emailAddress || "",
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
