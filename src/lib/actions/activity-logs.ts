"use server";

import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

interface LogActivityInput {
  userId: string;
  actionType: "create" | "update" | "delete" | "view" | "export";
  entityType: "student" | "payment" | "lead" | "attendance" | "session" | "evaluation" | "notification";
  entityId: string;
  details?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput) {
  try {
    await db.insert(activityLogs).values({
      userId: input.userId,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details || {},
    });
    return { success: true };
  } catch (error) {
    console.error("Error logging activity:", error);
    return { success: false };
  }
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

// Get activity logs for a specific entity
export async function getEntityActivityLogs(entityType: string, entityId: string) {
  try {
    const logs = await db.select().from(activityLogs)
      .where(and(
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId)
      ))
      .orderBy(desc(activityLogs.createdAt))
      .limit(50);

    return { success: true, logs };
  } catch (error) {
    console.error("Error fetching entity activity logs:", error);
    return { success: false, error: "فشل في جلب سجل النشاط" };
  }
}

// Get all activity logs (admin view)
export async function getAllActivityLogs(params?: {
  actionType?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  try {
    const conditions = [];

    if (params?.actionType) {
      conditions.push(eq(activityLogs.actionType, params.actionType));
    }
    if (params?.entityType) {
      conditions.push(eq(activityLogs.entityType, params.entityType));
    }
    if (params?.startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(params.startDate)));
    }
    if (params?.endDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(params.endDate)));
    }

    const logs = await db.select().from(activityLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activityLogs.createdAt))
      .limit(params?.limit || 100);

    return { success: true, logs };
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return { success: false, error: "فشل في جلب سجلات النشاط" };
  }
}

// Get activity stats summary
export async function getActivityStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayLogs = await db.select({ count: sql<number>`count(*)::int` }).from(activityLogs)
      .where(gte(activityLogs.createdAt, today));

    const weekLogs = await db.select({ count: sql<number>`count(*)::int` }).from(activityLogs)
      .where(gte(activityLogs.createdAt, weekAgo));

    const monthLogs = await db.select({ count: sql<number>`count(*)::int` }).from(activityLogs)
      .where(gte(activityLogs.createdAt, monthAgo));

    const recentLogs = await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(20);

    return {
      success: true,
      stats: {
        today: todayLogs[0]?.count || 0,
        thisWeek: weekLogs[0]?.count || 0,
        thisMonth: monthLogs[0]?.count || 0,
      },
      recentLogs,
    };
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return { success: false, error: "فشل في جلب إحصائيات النشاط" };
  }
}
