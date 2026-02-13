"use client";

import { UserButton } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutSwitcher } from "@/components/layout-switcher";

interface WebHeaderProps {
  userName: string;
}

export function WebHeader({ userName }: WebHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6 lg:px-8">
      {/* Left: Breadcrumb / Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">لوحة التحكم</h1>
          <p className="text-sm text-zinc-500 hidden sm:block">نظرة عامة على الأكاديمية</p>
        </div>
      </div>

      {/* Center: Search — hidden on small screens */}
      <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden md:block">
        <div className="relative">
          <Input
            type="search"
            placeholder="بحث عن لاعب، دفعة، أو عميل..."
            className="w-full bg-zinc-50 border-zinc-200 pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            🔍
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <LayoutSwitcher />
        
        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
          <span>➕</span>
          إضافة جديد
        </Button>

        <button className="relative rounded-full p-2 hover:bg-zinc-100">
          <span className="text-xl">🔔</span>
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            ٣
          </span>
        </button>

        <div className="hidden md:flex items-center gap-3 border-r border-zinc-200 pr-4 mr-2">
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-900">{userName}</p>
            <p className="text-xs text-zinc-500">مدير النظام</p>
          </div>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
