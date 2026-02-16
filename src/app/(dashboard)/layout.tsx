import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUserRole } from "@/lib/auth";
import { isRouteAllowed, getDefaultRoute } from "@/lib/auth-utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, userName } = await getCurrentUserRole();

  // Route guard: redirect coach away from unauthorized pages
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";

  // For coaches, check route access (server-side guard)
  if (role === "coach" && pathname && !isRouteAllowed(role, pathname)) {
    redirect(getDefaultRoute(role));
  }

  return (
    <DashboardShell userName={userName} userRole={role}>
      {children}
    </DashboardShell>
  );
}
