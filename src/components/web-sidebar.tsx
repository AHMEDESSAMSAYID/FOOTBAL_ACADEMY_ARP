"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/", label: "لوحة التحكم", icon: "📊" },
  { href: "/students", label: "اللاعبين", icon: "👥" },
  { href: "/payments", label: "المدفوعات", icon: "💰" },
  { href: "/crm", label: "العملاء المحتملين", icon: "📋" },
];

const secondaryNavItems = [
  { href: "/evaluations", label: "تقييم المدرب", icon: "⭐" },
  { href: "/student-reports", label: "تقارير الأداء", icon: "📊" },
  { href: "/reports", label: "التقارير", icon: "📈" },
  { href: "/attendance", label: "الحضور", icon: "✅" },
  { href: "/groups", label: "المجموعات", icon: "🏆" },
];

const settingsNavItems = [
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
  { href: "/help", label: "المساعدة", icon: "❓" },
];

export function WebSidebar() {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: { href: string; label: string; icon: string } }) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        pathname === item.href
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      <span className="text-base">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );

  return (
    <aside className="fixed top-0 right-0 bottom-0 z-40 flex w-64 flex-col border-l border-zinc-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xl text-white">
          ⚽
        </div>
        <div>
          <h1 className="font-bold text-zinc-900">إسبانيول</h1>
          <p className="text-xs text-zinc-500">نظام الإدارة</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            الرئيسية
          </p>
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            الإدارة
          </p>
          {secondaryNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            النظام
          </p>
          {settingsNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Quick Stats Footer */}
      <div className="border-t border-zinc-200 p-4">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">اللاعبين النشطين</span>
            <span className="font-bold text-green-600">١٢٥</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-zinc-600">كفاءة التحصيل</span>
            <span className="font-bold text-blue-600">٧٥٪</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
