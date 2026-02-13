"use server";

import { db } from "@/db";
import { students, contacts, payments, feeConfigs, paymentCoverage, leads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ===== Export Students to CSV (simple, universal format) =====

export async function exportStudentsData() {
  try {
    const allStudents = await db.select().from(students).orderBy(students.name);
    const allContacts = await db.select().from(contacts);
    const allFeeConfigs = await db.select().from(feeConfigs);

    const statusMap: Record<string, string> = {
      active: "نشط",
      inactive: "غير نشط",
      frozen: "مجمد",
      trial: "تجريبي",
    };

    const rows = allStudents.map((student) => {
      const studentContacts = allContacts.filter(c => c.studentId === student.id);
      const primaryPayer = studentContacts.find(c => c.isPrimaryPayer) || studentContacts[0];
      const feeConfig = allFeeConfigs.find(fc => fc.studentId === student.id);

      return {
        "رقم العضوية": student.membershipNumber || "",
        "الاسم": student.name,
        "الاسم الكامل": student.fullName || "",
        "الحالة": statusMap[student.status] || student.status,
        "الفئة العمرية": student.ageGroup || "",
        "تاريخ الميلاد": student.birthDate || "",
        "الجنسية": student.nationality || "",
        "المنطقة": student.area || "",
        "المدرسة": student.school || "",
        "الهاتف": student.phone || "",
        "ولي الأمر": primaryPayer?.name || "",
        "هاتف ولي الأمر": primaryPayer?.phone || "",
        "صلة القرابة": primaryPayer?.relation || "",
        "الاشتراك الشهري": feeConfig?.monthlyFee || "0",
        "رسوم الباص": feeConfig?.busFee || "0",
        "تاريخ التسجيل": student.registrationDate,
        "ملاحظات": student.notes || "",
      };
    });

    // Build CSV
    if (rows.length === 0) {
      return { success: false, error: "لا يوجد بيانات للتصدير" };
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      // BOM for Arabic support in Excel
      "\uFEFF" + headers.join(","),
      ...rows.map(row => 
        headers.map(h => {
          const val = String(row[h as keyof typeof row] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",")
      ),
    ].join("\n");

    return { 
      success: true, 
      data: csvContent, 
      filename: `students_${new Date().toISOString().split("T")[0]}.csv` 
    };
  } catch (error) {
    console.error("Error exporting students:", error);
    return { success: false, error: "فشل في تصدير البيانات" };
  }
}

// ===== Export Payments to CSV =====

export async function exportPaymentsData(startDate?: string, endDate?: string) {
  try {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.paymentDate));
    const allStudents = await db.select().from(students);

    const methodMap: Record<string, string> = {
      cash: "نقدي",
      bank_transfer: "تحويل بنكي",
    };

    const typeMap: Record<string, string> = {
      monthly: "اشتراك شهري",
      bus: "رسوم الباص",
      uniform: "الزي الرسمي",
    };

    let filteredPayments = allPayments;
    if (startDate) {
      filteredPayments = filteredPayments.filter(p => p.paymentDate >= startDate);
    }
    if (endDate) {
      filteredPayments = filteredPayments.filter(p => p.paymentDate <= endDate);
    }

    const rows = filteredPayments.map((payment) => {
      const student = allStudents.find(s => s.id === payment.studentId);
      return {
        "التاريخ": payment.paymentDate,
        "اللاعب": student?.name || "",
        "المبلغ": payment.amount,
        "نوع الرسوم": typeMap[payment.paymentType] || payment.paymentType,
        "طريقة الدفع": methodMap[payment.paymentMethod] || payment.paymentMethod,
        "الدافع": payment.payerName || "",
        "من شهر": payment.coverageStart || "",
        "إلى شهر": payment.coverageEnd || "",
        "ملاحظات": payment.notes || "",
      };
    });

    if (rows.length === 0) {
      return { success: false, error: "لا يوجد مدفوعات للتصدير" };
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      "\uFEFF" + headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = String(row[h as keyof typeof row] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",")
      ),
    ].join("\n");

    return { 
      success: true, 
      data: csvContent, 
      filename: `payments_${new Date().toISOString().split("T")[0]}.csv` 
    };
  } catch (error) {
    console.error("Error exporting payments:", error);
    return { success: false, error: "فشل في تصدير المدفوعات" };
  }
}

// ===== Export Leads to CSV =====

export async function exportLeadsData() {
  try {
    const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));

    const statusMap: Record<string, string> = {
      new: "جديد",
      contacted: "تم التواصل",
      interested: "مهتم",
      trial_scheduled: "تجربة محجوزة",
      trial_completed: "تم التجربة",
      converted: "تم التحويل",
      not_interested: "غير مهتم",
      waiting_other_area: "ينتظر منطقة أخرى",
    };

    const rows = allLeads.map((lead) => ({
      "الاسم": lead.name,
      "الهاتف": lead.phone,
      "اسم الطفل": lead.childName || "",
      "العمر": lead.age || "",
      "المنطقة": lead.area || "",
      "الحالة": statusMap[lead.status] || lead.status,
      "المصدر": lead.source || "",
      "المتابعة القادمة": lead.nextFollowup || "",
      "تاريخ الإنشاء": lead.createdAt?.toISOString().split("T")[0] || "",
    }));

    if (rows.length === 0) {
      return { success: false, error: "لا يوجد بيانات للتصدير" };
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      "\uFEFF" + headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = String(row[h as keyof typeof row] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",")
      ),
    ].join("\n");

    return { 
      success: true, 
      data: csvContent, 
      filename: `leads_${new Date().toISOString().split("T")[0]}.csv` 
    };
  } catch (error) {
    console.error("Error exporting leads:", error);
    return { success: false, error: "فشل في تصدير البيانات" };
  }
}
