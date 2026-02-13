import { currentUser } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  
  return (
    <DashboardShell userName={user?.firstName || "مستخدم"}>
      {children}
    </DashboardShell>
  );
}
