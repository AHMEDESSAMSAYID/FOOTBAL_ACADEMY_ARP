import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUserRole } from "@/lib/auth";
import { isRouteAllowed, getDefaultRoute } from "@/lib/auth-utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthRetryWrapper } from "./_components/auth-retry-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let authResult: Awaited<ReturnType<typeof getCurrentUserRole>> | null = null;

  try {
    authResult = await getCurrentUserRole();
  } catch (error: unknown) {
    // Re-throw NEXT_REDIRECT (redirect() throws this)
    if (error && typeof error === "object" && "digest" in error) {
      const digest = (error as { digest: string }).digest;
      if (digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }
    // For any other error (DB timeout, etc.), show retry UI
    return <AuthRetryWrapper />;
  }

  const { role, userName } = authResult;

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
