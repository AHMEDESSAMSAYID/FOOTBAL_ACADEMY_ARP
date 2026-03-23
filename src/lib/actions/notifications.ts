"use server";

import { db } from "@/db";
import { 
  notifications, 
  escalationLogs, 
  students, 
  contacts, 
  feeConfigs, 
  paymentCoverage 
} from "@/db/schema";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendSms } from "@/lib/sms";
import { getBillingInfo } from "@/lib/billing";

// ===== Notification Channel Config =====

interface UpdateChannelInput {
  contactId: string;
  email?: string;
  telegramId?: string;
}

export async function updateNotificationChannels(input: UpdateChannelInput) {
  try {
    await db.update(contacts).set({
      email: input.email || null,
      telegramId: input.telegramId || null,
    }).where(eq(contacts.id, input.contactId));

    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    console.error("Error updating notification channels:", error);
    return { success: false, error: "فشل في تحديث إعدادات الإشعارات" };
  }
}

// ===== Send Notification =====

async function createNotification(params: {
  studentId: string;
  contactId?: string;
  channel: "email" | "telegram";
  notificationType: "payment_reminder" | "payment_received" | "payment_overdue" | "trial_reminder" | "general";
  content: string;
}) {
  const [notification] = await db.insert(notifications).values({
    studentId: params.studentId,
    contactId: params.contactId,
    channel: params.channel,
    notificationType: params.notificationType,
    content: params.content,
    status: "pending",
  }).returning();

  // In production: integrate with email/Telegram API here
  // For now, mark as sent immediately (simulated)
  await db.update(notifications).set({
    status: "sent",
    sentAt: new Date(),
  }).where(eq(notifications.id, notification.id));

  return notification;
}

// ===== Payment Confirmation =====

export async function sendPaymentConfirmation(studentId: string, amount: string, monthsCovered: string) {
  try {
    const studentContacts = await db.select().from(contacts)
      .where(and(
        eq(contacts.studentId, studentId),
        eq(contacts.isPrimaryPayer, true)
      ));

    const primaryPayer = studentContacts[0];
    if (!primaryPayer) return { success: false, error: "لا يوجد دافع أساسي" };

    const content = `تم استلام دفعة بمبلغ ${amount} ₺ عن الأشهر: ${monthsCovered}. شكراً لكم.`;

    if (primaryPayer.email) {
      await createNotification({
        studentId,
        contactId: primaryPayer.id,
        channel: "email",
        notificationType: "payment_received",
        content,
      });
    }

    if (primaryPayer.telegramId) {
      await createNotification({
        studentId,
        contactId: primaryPayer.id,
        channel: "telegram",
        notificationType: "payment_received",
        content,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending payment confirmation:", error);
    return { success: false, error: "فشل في إرسال تأكيد الدفع" };
  }
}

// ===== Escalation Engine =====

export interface EscalationResult {
  processed: number;
  reminders: number;
  warnings: number;
  blocked: number;
  errors: string[];
}

export async function runEscalationCheck(): Promise<EscalationResult> {
  const result: EscalationResult = {
    processed: 0,
    reminders: 0,
    warnings: 0,
    blocked: 0,
    errors: [],
  };

  try {
    // Get all active students with fee configs
    const allStudents = await db.select().from(students)
      .where(eq(students.status, "active"));

    const allFeeConfigs = await db.select().from(feeConfigs);
    const allCoverage = await db.select().from(paymentCoverage);
    const allContacts = await db.select().from(contacts);

    // Get existing escalation logs (unresolved)
    const existingEscalations = await db.select().from(escalationLogs)
      .where(isNull(escalationLogs.resolvedAt));

    for (const student of allStudents) {
      const feeConfig = allFeeConfigs.find(fc => fc.studentId === student.id);
      if (!feeConfig) continue;

      // Use registration-based billing cycle
      const billing = getBillingInfo(student.registrationDate);
      
      const coverage = allCoverage.find(
        c => c.studentId === student.id && c.feeType === "monthly" && c.yearMonth === billing.currentDueYearMonth
      );

      const monthlyFee = parseFloat(feeConfig.monthlyFee);
      const amountPaid = coverage ? parseFloat(coverage.amountPaid) : 0;

      if (amountPaid >= monthlyFee) {
        // Student is paid, resolve any open escalations
        const openEscalation = existingEscalations.find(e => e.studentId === student.id);
        if (openEscalation) {
          await db.update(escalationLogs).set({
            resolvedAt: new Date(),
          }).where(eq(escalationLogs.id, openEscalation.id));
        }
        continue;
      }

      // Use billing-based days overdue instead of calendar day
      const daysOverdue = billing.daysSinceDue;

      const primaryContact = allContacts.find(
        c => c.studentId === student.id && c.isPrimaryPayer
      ) || allContacts.find(c => c.studentId === student.id);

      result.processed++;

      let level: "reminder" | "warning" | "blocked";
      let notificationType: "payment_reminder" | "payment_overdue";
      let content: string;

      if (daysOverdue >= 10) {
        level = "blocked";
        notificationType = "payment_overdue";
        content = `⛔ تم حظر الطالب ${student.name} بسبب تأخر الدفع ${daysOverdue} يوم. يرجى التواصل مع الإدارة.`;
        result.blocked++;
      } else if (daysOverdue >= 5) {
        level = "warning";
        notificationType = "payment_overdue";
        content = `⚠️ تنبيه: دفعة الطالب ${student.name} متأخرة ${daysOverdue} أيام. قد يتأثر الحضور.`;
        result.warnings++;
      } else {
        level = "reminder";
        notificationType = "payment_reminder";
        content = `📋 تذكير: دفعة فترة ${billing.currentDueYearMonth} مستحقة للطالب ${student.name}.`;
        result.reminders++;
      }

      // Check if we already sent this level
      const existingForStudent = existingEscalations.find(
        e => e.studentId === student.id && e.level === level
      );

      if (!existingForStudent) {
        // Send notification
        let notificationId: string | undefined;
        if (primaryContact) {
          if (primaryContact.email) {
            const notif = await createNotification({
              studentId: student.id,
              contactId: primaryContact.id,
              channel: "email",
              notificationType,
              content,
            });
            notificationId = notif.id;
          }
          if (primaryContact.telegramId) {
            await createNotification({
              studentId: student.id,
              contactId: primaryContact.id,
              channel: "telegram",
              notificationType,
              content,
            });
          }
        }

        // Log escalation
        await db.insert(escalationLogs).values({
          studentId: student.id,
          level,
          daysOverdue,
          notificationId,
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error running escalation check:", error);
    result.errors.push(String(error));
    return result;
  }
}

// ===== Get Escalation History =====

export async function getEscalationHistory(studentId: string) {
  try {
    const logs = await db.select().from(escalationLogs)
      .where(eq(escalationLogs.studentId, studentId))
      .orderBy(desc(escalationLogs.createdAt));

    const notifs = await db.select().from(notifications)
      .where(eq(notifications.studentId, studentId))
      .orderBy(desc(notifications.createdAt));

    return { success: true, escalations: logs, notifications: notifs };
  } catch (error) {
    console.error("Error fetching escalation history:", error);
    return { success: false, error: "فشل في جلب سجل التصعيد" };
  }
}

// ===== Get All Notifications =====

export async function getNotifications(studentId?: string) {
  try {
    if (studentId) {
      const notifs = await db.select().from(notifications)
        .where(eq(notifications.studentId, studentId))
        .orderBy(desc(notifications.createdAt));
      return { success: true, notifications: notifs };
    }

    const notifs = await db.select().from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(100);
    return { success: true, notifications: notifs };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "فشل في جلب الإشعارات" };
  }
}

// ===== SMS Notification Helpers =====

async function getParentPhones(studentId: string): Promise<string[]> {
  const parentContacts = await db
    .select({ phone: contacts.phone })
    .from(contacts)
    .where(eq(contacts.studentId, studentId));

  return parentContacts.map((c) => c.phone).filter(Boolean);
}

async function sendSmsToParents(studentId: string, message: string) {
  const phones = await getParentPhones(studentId);
  if (phones.length === 0) {
    return { success: false, error: "لا يوجد رقم هاتف لولي الأمر" };
  }

  const results = await Promise.all(
    phones.map((phone) => sendSms(phone, message))
  );

  const anySuccess = results.some((r) => r.success);
  if (anySuccess) {
    return { success: true, sent: results.filter((r) => r.success).length };
  }
  return { success: false, error: results[0]?.error || "فشل في إرسال الرسالة" };
}

// ===== SMS: Attendance Notification =====

export async function sendAttendanceSms(
  studentId: string,
  studentName: string,
  status: "present" | "absent" | "excused"
) {
  try {
    const statusText =
      status === "present"
        ? "حاضر ✅"
        : status === "absent"
          ? "غائب ❌"
          : "معذور ⚠️";

    const message = ` Española\n\nتم تسجيل حضور الطالب/ة ${studentName}\nالحالة: ${statusText}\n\nشكراً لكم`;

    return await sendSmsToParents(studentId, message);
  } catch (error) {
    console.error("Attendance SMS error:", error);
    return { success: false, error: "فشل في إرسال الإشعار" };
  }
}

// ===== SMS: Payment Notification =====

export async function sendPaymentSms(
  studentId: string,
  studentName: string,
  amount: number,
  paymentType: string
) {
  try {
    const typeText =
      paymentType === "monthly"
        ? "اشتراك شهري"
        : paymentType === "bus"
          ? "رسوم نقل"
          : "زي رياضي";

    const message = `أكاديمية Española\n\nتم تسجيل دفعة للطالب/ة ${studentName}\nالمبلغ: ${amount} ₺\nالنوع: ${typeText}\n\nشكراً لكم`;

    return await sendSmsToParents(studentId, message);
  } catch (error) {
    console.error("Payment SMS error:", error);
    return { success: false, error: "فشل في إرسال الإشعار" };
  }
}

// ===== SMS: Report Ready Notification =====

export async function sendReportSms(
  studentId: string,
  studentName: string
) {
  try {
    const message = `أكاديمية Española\n\nتقرير أداء الطالب/ة ${studentName} جاهز للمراجعة.\nيرجى التواصل مع الأكاديمية للاطلاع على التفاصيل.\n\nشكراً لكم`;

    return await sendSmsToParents(studentId, message);
  } catch (error) {
    console.error("Report SMS error:", error);
    return { success: false, error: "فشل في إرسال الإشعار" };
  }
}
