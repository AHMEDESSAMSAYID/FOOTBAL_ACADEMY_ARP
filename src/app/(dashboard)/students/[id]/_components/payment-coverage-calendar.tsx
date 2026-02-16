import { db } from "@/db";
import { paymentCoverage, feeConfigs, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { getBillingInfo } from "@/lib/billing";

interface PaymentCoverageCalendarProps {
  studentId: string;
}

/** Generate 12 billing periods starting from the registration date.
 *  Each period runs from billingDay of one month to billingDay of the next.
 *  Returns { yearMonth (for DB lookup), startLabel, endLabel }. */
function generateBillingPeriods(registrationDate: string) {
  const regDate = new Date(registrationDate + "T00:00:00");
  const billingDay = regDate.getDate();
  const periods: {
    yearMonth: string;
    label: string;
    startDate: Date;
    endDate: Date;
  }[] = [];

  for (let i = 0; i < 12; i++) {
    // Start of period i
    const startMonth = new Date(regDate.getFullYear(), regDate.getMonth() + i, 1);
    const daysInStart = new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 0).getDate();
    const effectiveStart = Math.min(billingDay, daysInStart);
    const start = new Date(startMonth.getFullYear(), startMonth.getMonth(), effectiveStart);

    // End of period = day before start of next period
    const nextMonth = new Date(regDate.getFullYear(), regDate.getMonth() + i + 1, 1);
    const daysInNext = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const effectiveNext = Math.min(billingDay, daysInNext);
    const end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), effectiveNext - 1);

    const yearMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    const label = `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;

    periods.push({ yearMonth, label, startDate: start, endDate: end });
  }

  return periods;
}

export async function PaymentCoverageCalendar({ studentId }: PaymentCoverageCalendarProps) {
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

  const registrationDate = student?.registrationDate || `${new Date().getFullYear()}-01-01`;
  const billing = getBillingInfo(registrationDate);
  const periods = generateBillingPeriods(registrationDate);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStatusStyle = (status: string | undefined, isFuture: boolean) => {
    if (isFuture) return "bg-zinc-100 text-zinc-400";
    if (!status) return "bg-red-100 text-red-700";
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

  const getStatusLabel = (status: string | undefined, isFuture: boolean) => {
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
      {/* Monthly Subscription - Billing Periods */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          الاشتراك الشهري
          <span className="text-sm font-normal text-zinc-500">({feeConfig.monthlyFee} TL/شهر • يوم الفوترة: {billing.billingDay})</span>
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {periods.map((period) => {
            const isFuture = period.yearMonth > billing.currentDueYearMonth;
            const isCurrent = period.yearMonth === billing.currentDueYearMonth;
            const monthCoverage = coverageMap.get(period.yearMonth)?.monthly;
            
            return (
              <div 
                key={period.yearMonth}
                className={`p-3 rounded-lg text-center transition-colors ${
                  getStatusStyle(monthCoverage?.status, isFuture)
                } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
              >
                <p className="text-xs font-medium" dir="ltr">{period.label}</p>
                <p className="text-[10px] mt-1">{getStatusLabel(monthCoverage?.status, isFuture)}</p>
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

      {/* Bus Fee - Billing Periods */}
      {feeConfig.busFee && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            رسوم الباص
            <span className="text-sm font-normal text-zinc-500">({feeConfig.busFee} TL/شهر)</span>
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {periods.map((period) => {
              const isFuture = period.yearMonth > billing.currentDueYearMonth;
              const isCurrent = period.yearMonth === billing.currentDueYearMonth;
              const busCoverage = coverageMap.get(period.yearMonth)?.bus;
              
              return (
                <div 
                  key={period.yearMonth}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    getStatusStyle(busCoverage?.status, isFuture)
                  } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
                >
                  <p className="text-xs font-medium" dir="ltr">{period.label}</p>
                  <p className="text-[10px] mt-1">{getStatusLabel(busCoverage?.status, isFuture)}</p>
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
