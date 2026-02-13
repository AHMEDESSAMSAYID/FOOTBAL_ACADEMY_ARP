"use server";

import { db } from "@/db";
import { leads, leadCommunications, students } from "@/db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type LeadStatus = "new" | "contacted" | "interested" | "trial_scheduled" | "trial_completed" | "converted" | "not_interested" | "waiting_other_area";

interface CreateLeadInput {
  name: string;
  phone: string;
  childName?: string;
  age?: number;
  area?: string;
  source?: string;
  nextFollowup?: string;
}

interface UpdateLeadInput {
  id: string;
  name?: string;
  phone?: string;
  childName?: string;
  age?: number;
  area?: string;
  status?: LeadStatus;
  source?: string;
  nextFollowup?: string | null;
}

interface AddCommunicationInput {
  leadId: string;
  notes: string;
  channel?: "call" | "whatsapp" | "visit" | "other";
  outcome?: string;
  nextAction?: string;
}

// Create a new lead
export async function createLead(input: CreateLeadInput) {
  try {
    const [lead] = await db.insert(leads).values({
      name: input.name,
      phone: input.phone,
      childName: input.childName,
      age: input.age,
      area: input.area,
      source: input.source,
      nextFollowup: input.nextFollowup,
    }).returning();

    revalidatePath("/crm");
    return { success: true, lead };
  } catch (error) {
    console.error("Error creating lead:", error);
    return { success: false, error: "فشل في إنشاء العميل المحتمل" };
  }
}

// Update lead
export async function updateLead(input: UpdateLeadInput) {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.childName !== undefined) updateData.childName = input.childName;
    if (input.age !== undefined) updateData.age = input.age;
    if (input.area !== undefined) updateData.area = input.area;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.nextFollowup !== undefined) updateData.nextFollowup = input.nextFollowup;

    await db.update(leads)
      .set(updateData)
      .where(eq(leads.id, input.id));

    revalidatePath("/crm");
    revalidatePath(`/crm/${input.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating lead:", error);
    return { success: false, error: "فشل في تحديث بيانات العميل" };
  }
}

// Update lead status
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  try {
    await db.update(leads)
      .set({ status, updatedAt: new Date() })
      .where(eq(leads.id, leadId));

    revalidatePath("/crm");
    revalidatePath(`/crm/${leadId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating lead status:", error);
    return { success: false, error: "فشل في تحديث حالة العميل" };
  }
}

// Get all leads with optional filters
export async function getLeads(filter?: {
  status?: LeadStatus;
  search?: string;
}) {
  try {
    const conditions = [];
    
    if (filter?.status) {
      conditions.push(eq(leads.status, filter.status));
    }
    
    if (filter?.search) {
      conditions.push(
        or(
          like(leads.name, `%${filter.search}%`),
          like(leads.phone, `%${filter.search}%`),
          like(leads.childName, `%${filter.search}%`)
        )
      );
    }

    const result = await db
      .select()
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leads.createdAt));

    return { success: true, leads: result };
  } catch (error) {
    console.error("Error fetching leads:", error);
    return { success: false, leads: [], error: "فشل في تحميل العملاء" };
  }
}

// Get single lead with communications
export async function getLead(leadId: string) {
  try {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return { success: false, error: "العميل غير موجود" };
    }

    const communications = await db
      .select()
      .from(leadCommunications)
      .where(eq(leadCommunications.leadId, leadId))
      .orderBy(desc(leadCommunications.communicationDate));

    return { success: true, lead, communications };
  } catch (error) {
    console.error("Error fetching lead:", error);
    return { success: false, error: "فشل في تحميل بيانات العميل" };
  }
}

// Add communication record
export async function addCommunication(input: AddCommunicationInput) {
  try {
    const [comm] = await db.insert(leadCommunications).values({
      leadId: input.leadId,
      communicationDate: new Date(),
      notes: input.notes,
      channel: input.channel,
      outcome: input.outcome,
      nextAction: input.nextAction,
    }).returning();

    // Update lead status to contacted if it's new
    await db.update(leads)
      .set({ 
        status: sql`CASE WHEN status = 'new' THEN 'contacted' ELSE status END`,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, input.leadId));

    revalidatePath("/crm");
    revalidatePath(`/crm/${input.leadId}`);
    return { success: true, communication: comm };
  } catch (error) {
    console.error("Error adding communication:", error);
    return { success: false, error: "فشل في إضافة المحادثة" };
  }
}

// Convert lead to student
export async function convertLeadToStudent(leadId: string, studentData: {
  name: string;
  phone?: string;
  ageGroup?: "5-10" | "10-15" | "15+";
  area?: string;
}) {
  try {
    // Create student
    const [student] = await db.insert(students).values({
      name: studentData.name,
      phone: studentData.phone,
      ageGroup: studentData.ageGroup,
      area: studentData.area,
      status: "trial",
      registrationDate: new Date().toISOString().split("T")[0],
    }).returning();

    // Update lead status
    await db.update(leads)
      .set({ 
        status: "converted",
        convertedToStudentId: student.id,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    revalidatePath("/crm");
    revalidatePath("/students");
    return { success: true, student };
  } catch (error) {
    console.error("Error converting lead:", error);
    return { success: false, error: "فشل في تحويل العميل إلى طالب" };
  }
}

// Get CRM stats
export async function getCrmStats() {
  try {
    const allLeads = await db.select().from(leads);
    
    const newCount = allLeads.filter(l => l.status === "new").length;
    const contactedCount = allLeads.filter(l => l.status === "contacted").length;
    const interestedCount = allLeads.filter(l => l.status === "interested").length;
    const trialScheduledCount = allLeads.filter(l => l.status === "trial_scheduled").length;
    const convertedCount = allLeads.filter(l => l.status === "converted").length;
    
    // Leads needing follow-up (nextFollowup <= today)
    const today = new Date().toISOString().split("T")[0];
    const needsFollowup = allLeads.filter(l => 
      l.nextFollowup && l.nextFollowup <= today && 
      !["converted", "not_interested"].includes(l.status)
    );

    return {
      success: true,
      stats: {
        total: allLeads.length,
        newCount,
        contactedCount,
        interestedCount,
        trialScheduledCount,
        convertedCount,
        needsFollowupCount: needsFollowup.length,
      },
      needsFollowup,
    };
  } catch (error) {
    console.error("Error fetching CRM stats:", error);
    return { 
      success: false, 
      stats: { 
        total: 0, newCount: 0, contactedCount: 0, interestedCount: 0, 
        trialScheduledCount: 0, convertedCount: 0, needsFollowupCount: 0 
      },
      needsFollowup: [],
    };
  }
}
