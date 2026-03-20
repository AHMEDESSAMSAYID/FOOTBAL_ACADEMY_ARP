export type UserRole = "admin" | "coach";

// Coach-accessible routes
export const COACH_ALLOWED_ROUTES = [
  "/evaluations",
  "/student-reports",
  "/attendance",
];

/**
 * Check if a route is accessible for the given role.
 */
export function isRouteAllowed(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true;
  return COACH_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

/**
 * Get the default redirect path for a role.
 */
export function getDefaultRoute(role: UserRole): string {
  return role === "coach" ? "/evaluations" : "/";
}

/**
 * Get filtered nav items based on role.
 */
export function getNavItemsForRole(role: UserRole) {
  const mainNavItems = [
    { href: "/", label: "لوحة التحكم", icon: "📊" },
    { href: "/students", label: "اللاعبين", icon: "👥" },
    { href: "/payments", label: "المدفوعات", icon: "💰" },
    { href: "/crm", label: "العملاء المحتملين", icon: "📋" },
  ];

  const secondaryNavItems = [
    { href: "/evaluations", label: "تقييم لاعب الشهر", icon: "⭐" },
    { href: "/student-reports", label: "تقارير الأداء", icon: "📊" },
    { href: "/reports", label: "التقارير", icon: "📈" },
    { href: "/attendance", label: "الحضور", icon: "✅" },
    { href: "/groups", label: "المجموعات", icon: "🏆" },
  ];

  const settingsNavItems = [
    { href: "/settings", label: "الإعدادات", icon: "⚙️" },
    { href: "/help", label: "المساعدة", icon: "❓" },
  ];

  if (role === "coach") {
    return {
      mainNavItems: [],
      secondaryNavItems: secondaryNavItems.filter((item) =>
        COACH_ALLOWED_ROUTES.includes(item.href)
      ),
      settingsNavItems: [],
    };
  }

  return { mainNavItems, secondaryNavItems, settingsNavItems };
}

/**
 * Get filtered mobile nav items based on role.
 */
export function getMobileNavItemsForRole(role: UserRole) {
  const mainNavItems = [
    { href: "/", label: "اليوم", icon: "📊" },
    { href: "/students", label: "اللاعبين", icon: "👥" },
    { href: "/payments", label: "المدفوعات", icon: "💰" },
    { href: "/crm", label: "CRM", icon: "📋" },
  ];

  const managementItems = [
    { href: "/evaluations", label: "تقييم لاعب الشهر", icon: "⭐" },
    { href: "/student-reports", label: "تقارير الأداء", icon: "📊" },
    { href: "/reports", label: "التقارير", icon: "📈" },
    { href: "/attendance", label: "الحضور", icon: "✅" },
    { href: "/groups", label: "المجموعات", icon: "🏆" },
    { href: "/settings", label: "الإعدادات", icon: "⚙️" },
    { href: "/help", label: "المساعدة", icon: "❓" },
  ];

  if (role === "coach") {
    return {
      mainNavItems: managementItems.filter((item) =>
        COACH_ALLOWED_ROUTES.includes(item.href)
      ),
      managementItems: [],
      showManagementToggle: false,
    };
  }

  return {
    mainNavItems,
    managementItems,
    showManagementToggle: true,
  };
}
