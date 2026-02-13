"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-3xl">⚠️</span>
          </div>
          <CardTitle className="text-xl">حدث خطأ غير متوقع</CardTitle>
          <CardDescription>
            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-lg bg-zinc-100 p-3">
              <p className="text-xs text-zinc-500 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button 
              onClick={reset}
              className="flex-1"
            >
              حاول مرة أخرى
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="flex-1"
            >
              الصفحة الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
