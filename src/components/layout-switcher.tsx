"use client";

import { useLayout } from "@/lib/layout-context";
import { Button } from "@/components/ui/button";

export function LayoutSwitcher() {
  const { layout, setLayout } = useLayout();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
      <Button
        variant={layout === "mobile" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLayout("mobile")}
        className="h-8 px-3 text-xs"
      >
        📱 موبايل
      </Button>
      <Button
        variant={layout === "web" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLayout("web")}
        className="h-8 px-3 text-xs"
      >
        💻 ويب
      </Button>
    </div>
  );
}
