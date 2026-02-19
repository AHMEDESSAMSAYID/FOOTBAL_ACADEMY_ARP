import { getDashboardStats } from "@/lib/actions/dashboard";
import { DashboardContent } from "./_components/dashboard-content";
import MonthPicker from "@/components/month-picker";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedMonth = params.month || undefined;
  const displayMonth = selectedMonth || getCurrentYearMonth();
  const stats = await getDashboardStats(selectedMonth);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Suspense>
          <MonthPicker currentMonth={displayMonth} />
        </Suspense>
      </div>
      <DashboardContent stats={stats} />
    </div>
  );
}
