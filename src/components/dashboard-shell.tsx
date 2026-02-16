"use client";

import { UserButton } from "@clerk/nextjs";
import { useLayout, LayoutProvider } from "@/lib/layout-context";
import { LayoutSwitcher } from "@/components/layout-switcher";
import { WebSidebar } from "@/components/web-sidebar";
import { WebHeader } from "@/components/web-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { RouteGuard } from "@/components/route-guard";
import type { UserRole } from "@/lib/auth-utils";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  userRole: UserRole;
}

function DashboardContent({ children, userName, userRole }: DashboardShellProps) {
  const { layout, isHydrated } = useLayout();
  
  // Show loading state until hydrated to prevent mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-zinc-200 animate-pulse" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-20 bg-zinc-200 rounded animate-pulse" />
          </div>
        </header>
        <main className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-zinc-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-zinc-200 rounded-lg" />
              <div className="h-24 bg-zinc-200 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isWeb = layout === "web";

  // Web Layout: Sidebar + Header + Content
  if (isWeb) {
    return (
      <div className="min-h-screen bg-zinc-100">
        {/* Fixed Sidebar — hidden below lg */}
        <div className="hidden lg:block">
          <WebSidebar userRole={userRole} />
        </div>
        
        {/* Main Area (shifted for sidebar on lg+) */}
        <div className="lg:mr-64">
          {/* Fixed Header */}
          <WebHeader userName={userName} />
          
          {/* Content Area — less padding on smaller screens */}
          <main className="pt-20 p-4 md:p-6 lg:p-8">
            <RouteGuard userRole={userRole}>
              {children}
            </RouteGuard>
          </main>
        </div>
      </div>
    );
  }

  // Mobile Layout: Header + Content + Bottom Nav
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
            <div className="text-sm">
              <p className="font-medium">
                مرحباً، {userName}
              </p>
              <p className="text-xs text-zinc-500">
                أكاديمية إسبانيول
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LayoutSwitcher />
            <h1 className="text-lg font-bold">إسبانيول</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <RouteGuard userRole={userRole}>
          {children}
        </RouteGuard>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav userRole={userRole} />
    </div>
  );
}

export function DashboardShell({ children, userName, userRole }: DashboardShellProps) {
  return (
    <LayoutProvider>
      <DashboardContent userName={userName} userRole={userRole}>
        {children}
      </DashboardContent>
    </LayoutProvider>
  );
}
