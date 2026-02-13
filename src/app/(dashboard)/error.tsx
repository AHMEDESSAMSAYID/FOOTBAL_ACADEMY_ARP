"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">⚠️</span>
          </div>
          <CardTitle className="text-lg">خطأ في تحميل البيانات</CardTitle>
          <CardDescription>
            حدث خطأ أثناء تحميل هذا القسم
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 rounded-lg bg-zinc-100 p-3">
              <p className="text-xs text-zinc-500 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
          <Button 
            onClick={reset}
            className="w-full"
          >
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
