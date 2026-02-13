import { getDashboardStats } from "@/lib/actions/dashboard";
import { DashboardContent } from "./_components/dashboard-content";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
  return <DashboardContent stats={stats} />;
}
