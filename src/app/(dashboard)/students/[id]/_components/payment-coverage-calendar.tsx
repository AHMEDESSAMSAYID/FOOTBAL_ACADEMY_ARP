import { db } from "@/db";
import { paymentCoverage, feeConfigs, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { getBillingInfo, isBeforeRegistration } from "@/lib/billing";

interface PaymentCoverageCalendarProps {
  studentId: string;
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

// Generate months for the current year
function generateYearMonths(year: number): string[] {
  const months: string[] = [];
  for (let month = 1; month <= 12; month++) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return months;
}

export async function PaymentCoverageCalendar({ studentId }: PaymentCoverageCalendarProps) {
  const currentYear = new Date().getFullYear();
  const yearMonths = generateYearMonths(currentYear);
  
  // Fetch student for registration date
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  // Fetch fee config
  const feeConfig = await db.query.feeConfigs.findFirst({
    where: eq(feeConfigs.studentId, studentId),
  });

  // Fetch all coverage for this student
  const coverage = await db
    .select()
    .from(paymentCoverage)
    .where(eq(paymentCoverage.studentId, studentId));

  // Use registration-based billing info
  const registrationDate = student?.registrationDate || `${currentYear}-01-01`;
  const billing = getBillingInfo(registrationDate);

  // Build coverage map
  const coverageMap = new Map<string, { monthly?: typeof coverage[0]; bus?: typeof coverage[0] }>();
  for (const c of coverage) {
    const existing = coverageMap.get(c.yearMonth) || {};
    if (c.feeType === "monthly") {
      existing.monthly = c;
    } else {
      existing.bus = c;
    }
    coverageMap.set(c.yearMonth, existing);
  }

  const getStatusStyle = (status: string | undefined, isFuture: boolean, isPreRegistration: boolean) => {
    if (isPreRegistration) return "bg-zinc-50 text-zinc-300";
    if (isFuture) return "bg-zinc-100 text-zinc-400";
    if (!status) return "bg-red-100 text-red-700"; // No coverage = overdue
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "partial":
        return "bg-amber-100 text-amber-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-zinc-100 text-zinc-500";
    }
  };

  const getStatusLabel = (status: string | undefined, isFuture: boolean, isPreRegistration: boolean) => {
    if (isPreRegistration) return "—";
    if (isFuture) return "قادم";
    if (!status) return "غير مدفوع";
    switch (status) {
      case "paid":
        return "مدفوع ✓";
      case "partial":
        return "جزئي";
      case "overdue":
        return "متأخر";
      default:
        return "غير محدد";
    }
  };

  if (!feeConfig) {
    return (
      <div className="text-center py-8 text-zinc-500">
        لم يتم تكوين الرسوم لهذا اللاعب بعد
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Monthly Subscription Calendar */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          الاشتراك الشهري
          <span className="text-sm font-normal text-zinc-500">({feeConfig.monthlyFee} TL/شهر • يوم الفوترة: {billing.billingDay})</span>
        </h4>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {yearMonths.map((yearMonth) => {
            const monthIndex = parseInt(yearMonth.split("-")[1]) - 1;
            const isPreRegistration = isBeforeRegistration(yearMonth, registrationDate);
            const isFuture = yearMonth > billing.currentDueYearMonth && !isPreRegistration;
            const isCurrent = yearMonth === billing.currentDueYearMonth;
            const monthCoverage = coverageMap.get(yearMonth)?.monthly;
            
            return (
              <div 
                key={yearMonth}
                className={`p-3 rounded-lg text-center transition-colors ${
                  getStatusStyle(monthCoverage?.status, isFuture, isPreRegistration)
                } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
              >
                <p className="text-xs font-medium">{arabicMonths[monthIndex]}</p>
                <p className="text-[10px] mt-1">{getStatusLabel(monthCoverage?.status, isFuture, isPreRegistration)}</p>
                {monthCoverage && monthCoverage.status === "partial" && (
                  <p className="text-[10px]">
                    {monthCoverage.amountPaid}/{monthCoverage.amountDue}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bus Fee Calendar (if applicable) */}
      {feeConfig.busFee && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            رسوم الباص
            <span className="text-sm font-normal text-zinc-500">({feeConfig.busFee} TL/شهر)</span>
          </h4>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {yearMonths.map((yearMonth) => {
              const monthIndex = parseInt(yearMonth.split("-")[1]) - 1;
              const isPreRegistration = isBeforeRegistration(yearMonth, registrationDate);
              const isFuture = yearMonth > billing.currentDueYearMonth && !isPreRegistration;
              const isCurrent = yearMonth === billing.currentDueYearMonth;
              const busCoverage = coverageMap.get(yearMonth)?.bus;
              
              return (
                <div 
                  key={yearMonth}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    getStatusStyle(busCoverage?.status, isFuture, isPreRegistration)
                  } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
                >
                  <p className="text-xs font-medium">{arabicMonths[monthIndex]}</p>
                  <p className="text-[10px] mt-1">{getStatusLabel(busCoverage?.status, isFuture, isPreRegistration)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100" />
          <span>مدفوع</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100" />
          <span>جزئي</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100" />
          <span>متأخر</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-zinc-100" />
          <span>قادم</span>
        </div>
      </div>
    </div>
  );
}
