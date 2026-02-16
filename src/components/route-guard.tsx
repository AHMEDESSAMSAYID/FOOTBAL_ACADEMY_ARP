"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isRouteAllowed, getDefaultRoute } from "@/lib/auth-utils";
import type { UserRole } from "@/lib/auth-utils";

interface RouteGuardProps {
  userRole: UserRole;
  children: React.ReactNode;
}

export function RouteGuard({ userRole, children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "coach" && !isRouteAllowed(userRole, pathname)) {
      router.replace(getDefaultRoute(userRole));
    }
  }, [pathname, userRole, router]);

  // Don't render unauthorized content
  if (userRole === "coach" && !isRouteAllowed(userRole, pathname)) {
    return null;
  }

  return <>{children}</>;
}
