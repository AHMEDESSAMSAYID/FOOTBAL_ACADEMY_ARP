"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { getMobileNavItemsForRole } from "@/lib/auth-utils";
import type { UserRole } from "@/lib/auth-utils";

interface MobileBottomNavProps {
  userRole: UserRole;
}

export function MobileBottomNav({ userRole }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { mainNavItems, managementItems, showManagementToggle } = getMobileNavItemsForRole(userRole);
  const managementPaths = managementItems.map((i) => i.href);

  // Close menu on route change
  useEffect(() => {
    setShowMenu(false);
  }, [pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const isManagementActive = managementPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <>
      {/* Backdrop */}
      {showMenu && showManagementToggle && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
      )}

      {/* Slide-up management menu */}
      {showManagementToggle && (
        <div
          ref={menuRef}
          className={cn(
            "fixed bottom-16 left-0 right-0 z-50 transform transition-all duration-300 ease-out",
            showMenu
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <div className="mx-3 mb-2 rounded-2xl bg-white border border-zinc-200 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <p className="text-sm font-bold text-zinc-700">الإدارة</p>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {managementItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs transition-colors",
                    pathname === item.href
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200"
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-center leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white">
        <div className="flex h-16 items-center justify-around">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors",
                pathname === item.href
                  ? "text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Management toggle button */}
          {showManagementToggle && (
            <button
              onClick={() => setShowMenu((p) => !p)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors",
                showMenu || isManagementActive
                  ? "text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <span className="text-lg">{showMenu ? "✕" : "📂"}</span>
              <span>الإدارة</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
