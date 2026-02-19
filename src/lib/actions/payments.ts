"use server";

import { db } from "@/db";
import { feeConfigs, payments, paymentCoverage } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Story 3-2: Configure Custom Pricing Per Student
interface FeeConfigInput {
  studentId: string;
  monthlyFee: number;
  busFee?: number;
  uniformPrice?: number;
  uniformPaid?: boolean;
  discountType?: "fixed" | "percentage" | "sibling" | "other";
  discountAmount?: number;
  discountReason?: string;
}

export async function upsertFeeConfig(input: FeeConfigInput) {
  try {
    const existingConfig = await db.query.feeConfigs.findFirst({
      where: eq(feeConfigs.studentId, input.studentId),
    });

    // Sanitize: convert empty/falsy discountType to null for the enum column
    const safeDiscountType = input.discountType || null;
    const safeDiscountAmount = input.discountAmount?.toString() ?? null;
    const safeDiscountReason = input.discountReason || null;

    if (existingConfig) {
      // Update existing config
      await db
        .update(feeConfigs)
        .set({
          monthlyFee: input.monthlyFee.toString(),
          busFee: input.busFee?.toString() ?? null,
          uniformPrice: input.uniformPrice?.toString() ?? null,
          uniformPaid: input.uniformPaid,
          discountType: safeDiscountType,
          discountAmount: safeDiscountAmount,
          discountReason: safeDiscountReason,
          updatedAt: new Date(),
        })
        .where(eq(feeConfigs.studentId, input.studentId));
    } else {
      // Create new config
      await db.insert(feeConfigs).values({
        studentId: input.studentId,
        monthlyFee: input.monthlyFee.toString(),
        busFee: input.busFee?.toString() ?? null,
        uniformPrice: input.uniformPrice?.toString() ?? null,
        uniformPaid: input.uniformPaid ?? false,
        discountType: safeDiscountType,
        discountAmount: safeDiscountAmount,
        discountReason: safeDiscountReason,
        effectiveFrom: new Date().toISOString().split("T")[0],
      });
    }

    revalidatePath(`/students/${input.studentId}`);
    return { success: true };
  } catch (error) {
    console.error("Error saving fee config:", error);
    return { success: false, error: "فشل في حفظ الرسوم" };
  }
}

// Story 3-3: Record Payment with Coverage Period
interface PaymentInput {
  studentId: string;
  amount: number;
  paymentType: "monthly" | "bus" | "uniform";
  paymentMethod: "cash" | "bank_transfer";
  payerName?: string;
  notes?: string;
  paymentDate: string;
  coverageStart?: string; // YYYY-MM-DD
  coverageEnd?: string;   // YYYY-MM-DD
}

/**
 * Derive all YYYY-MM strings that a date range spans.
 * E.g. 2026-01-15 → 2026-02-14 returns ["2026-01","2026-02"]
 */
function getMonthsInRange(start: string, end: string): string[] {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const months: string[] = [];
  const cur = new Date(s.getFullYear(), s.getMonth(), 1);
  while (cur <= e) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

export async function recordPayment(input: PaymentInput) {
  try {
    // Insert payment
    const [payment] = await db
      .insert(payments)
      .values({
        studentId: input.studentId,
        amount: input.amount.toString(),
        paymentType: input.paymentType,
        paymentMethod: input.paymentMethod,
        payerName: input.payerName,
        notes: input.notes,
        paymentDate: input.paymentDate,
        coverageStart: input.coverageStart || null,
        coverageEnd: input.coverageEnd || null,
        monthsCovered: input.coverageStart && input.coverageEnd
          ? getMonthsInRange(input.coverageStart, input.coverageEnd).length
          : null,
      })
      .returning();

    // Create payment coverage records for each month the range spans
    if (input.coverageStart && input.coverageEnd && input.paymentType !== "uniform") {
      const months = getMonthsInRange(input.coverageStart, input.coverageEnd);
      const amountPerMonth = input.amount / months.length;
      const feeType = input.paymentType === "monthly" ? "monthly" : "bus";

      for (const yearMonth of months) {
        // Check if coverage record exists
        const existingCoverage = await db.query.paymentCoverage.findFirst({
          where: (pc, { and }) => 
            and(
              eq(pc.studentId, input.studentId),
              eq(pc.yearMonth, yearMonth),
              eq(pc.feeType, feeType)
            ),
        });

        if (existingCoverage) {
          // Update existing coverage
          const newAmountPaid = parseFloat(existingCoverage.amountPaid) + amountPerMonth;
          const amountDue = parseFloat(existingCoverage.amountDue);
          const newStatus = newAmountPaid >= amountDue ? "paid" : "partial";

          await db
            .update(paymentCoverage)
            .set({
              amountPaid: newAmountPaid.toString(),
              status: newStatus,
              paymentId: payment.id,
            })
            .where(eq(paymentCoverage.id, existingCoverage.id));
        } else {
          // Get fee config to know amount due
          const feeConfig = await db.query.feeConfigs.findFirst({
            where: eq(feeConfigs.studentId, input.studentId),
          });

          const amountDue = feeType === "monthly" 
            ? parseFloat(feeConfig?.monthlyFee || "0")
            : parseFloat(feeConfig?.busFee || "0");

          const status = amountPerMonth >= amountDue ? "paid" : "partial";

          await db.insert(paymentCoverage).values({
            studentId: input.studentId,
            feeType,
            yearMonth,
            amountDue: amountDue.toString(),
            amountPaid: amountPerMonth.toString(),
            status,
            paymentId: payment.id,
          });
        }
      }
    }

    revalidatePath(`/students/${input.studentId}`);
    revalidatePath("/payments");
    return { success: true, payment };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: "فشل في تسجيل الدفعة" };
  }
}

// Get payments for a student
export async function getStudentPayments(studentId: string) {
  try {
    const studentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId))
      .orderBy(payments.paymentDate);
    
    return { success: true, payments: studentPayments };
  } catch (error) {
    console.error("Error fetching payments:", error);
    return { success: false, payments: [], error: "فشل في تحميل المدفوعات" };
  }
}

// Get payment coverage for a student
export async function getStudentPaymentCoverage(studentId: string) {
  try {
    const coverage = await db
      .select()
      .from(paymentCoverage)
      .where(eq(paymentCoverage.studentId, studentId))
      .orderBy(paymentCoverage.yearMonth);
    
    return { success: true, coverage };
  } catch (error) {
    console.error("Error fetching coverage:", error);
    return { success: false, coverage: [], error: "فشل في تحميل التغطية" };
  }
}

// Get fee config for a student
export async function getStudentFeeConfig(studentId: string) {
  try {
    const config = await db.query.feeConfigs.findFirst({
      where: eq(feeConfigs.studentId, studentId),
    });
    
    return { success: true, config };
  } catch (error) {
    console.error("Error fetching fee config:", error);
    return { success: false, config: null, error: "فشل في تحميل الرسوم" };
  }
}

// Update an existing payment + recalculate coverage
interface UpdatePaymentInput {
  paymentId: string;
  studentId: string;
  amount: number;
  paymentType: "monthly" | "bus" | "uniform";
  paymentMethod: "cash" | "bank_transfer";
  payerName?: string;
  notes?: string;
  paymentDate: string;
  coverageStart?: string; // YYYY-MM-DD
  coverageEnd?: string;   // YYYY-MM-DD
}

export async function updatePayment(input: UpdatePaymentInput) {
  try {
    // 1) Delete old coverage records linked to this payment
    await db
      .delete(paymentCoverage)
      .where(eq(paymentCoverage.paymentId, input.paymentId));

    const months = input.coverageStart && input.coverageEnd
      ? getMonthsInRange(input.coverageStart, input.coverageEnd)
      : [];

    // 2) Update the payment record
    await db
      .update(payments)
      .set({
        amount: input.amount.toString(),
        paymentType: input.paymentType,
        paymentMethod: input.paymentMethod,
        payerName: input.payerName || null,
        notes: input.notes || null,
        paymentDate: input.paymentDate,
        coverageStart: input.coverageStart || null,
        coverageEnd: input.coverageEnd || null,
        monthsCovered: months.length || null,
      })
      .where(eq(payments.id, input.paymentId));

    // 3) Re-create coverage records
    if (months.length > 0 && input.paymentType !== "uniform") {
      const amountPerMonth = input.amount / months.length;
      const feeType = input.paymentType === "monthly" ? "monthly" : "bus";

      const feeConfig = await db.query.feeConfigs.findFirst({
        where: eq(feeConfigs.studentId, input.studentId),
      });

      const amountDue = feeType === "monthly"
        ? parseFloat(feeConfig?.monthlyFee || "0")
        : parseFloat(feeConfig?.busFee || "0");

      for (const yearMonth of months) {
        // Check if another payment already covers this month
        const existingCoverage = await db.query.paymentCoverage.findFirst({
          where: (pc, { and: a }) =>
            a(
              eq(pc.studentId, input.studentId),
              eq(pc.yearMonth, yearMonth),
              eq(pc.feeType, feeType)
            ),
        });

        if (existingCoverage) {
          const newAmountPaid = parseFloat(existingCoverage.amountPaid) + amountPerMonth;
          const newStatus = newAmountPaid >= amountDue ? "paid" : "partial";
          await db
            .update(paymentCoverage)
            .set({
              amountPaid: newAmountPaid.toString(),
              status: newStatus,
              paymentId: input.paymentId,
            })
            .where(eq(paymentCoverage.id, existingCoverage.id));
        } else {
          const status = amountPerMonth >= amountDue ? "paid" : "partial";
          await db.insert(paymentCoverage).values({
            studentId: input.studentId,
            feeType,
            yearMonth,
            amountDue: amountDue.toString(),
            amountPaid: amountPerMonth.toString(),
            status,
            paymentId: input.paymentId,
          });
        }
      }
    }

    revalidatePath(`/students/${input.studentId}`);
    revalidatePath("/payments");
    return { success: true };
  } catch (error) {
    console.error("Error updating payment:", error);
    return { success: false, error: "فشل في تحديث الدفعة" };
  }
}

// Delete a payment and its coverage
export async function deletePayment(paymentId: string, studentId: string) {
  try {
    // Delete coverage records first
    await db
      .delete(paymentCoverage)
      .where(eq(paymentCoverage.paymentId, paymentId));

    // Delete the payment
    await db.delete(payments).where(eq(payments.id, paymentId));

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/payments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "فشل في حذف الدفعة" };
  }
}

// Quick inline update – basic fields only (no coverage recalculation)
interface UpdatePaymentQuickInput {
  paymentId: string;
  studentId: string;
  amount: number;
  paymentType: "monthly" | "bus" | "uniform";
  paymentMethod: "cash" | "bank_transfer";
  payerName?: string;
  notes?: string;
  paymentDate: string;
}

export async function updatePaymentQuick(input: UpdatePaymentQuickInput) {
  try {
    await db
      .update(payments)
      .set({
        amount: input.amount.toString(),
        paymentType: input.paymentType,
        paymentMethod: input.paymentMethod,
        payerName: input.payerName || null,
        notes: input.notes || null,
        paymentDate: input.paymentDate,
      })
      .where(eq(payments.id, input.paymentId));

    revalidatePath(`/students/${input.studentId}`);
    revalidatePath("/payments");
    return { success: true };
  } catch (error) {
    console.error("Error quick-updating payment:", error);
    return { success: false, error: "فشل في تحديث الدفعة" };
  }
}

// Get a single payment by ID
export async function getPaymentById(paymentId: string) {
  try {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
    });
    if (!payment) return { success: false, payment: null, error: "الدفعة غير موجودة" };

    // Get linked coverage months
    const coverage = await db
      .select()
      .from(paymentCoverage)
      .where(eq(paymentCoverage.paymentId, paymentId));

    const coveredMonths = coverage.map((c) => c.yearMonth).sort();

    return { success: true, payment, coveredMonths };
  } catch (error) {
    console.error("Error fetching payment:", error);
    return { success: false, payment: null, error: "فشل في تحميل الدفعة" };
  }
}
