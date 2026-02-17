"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Shown when the dashboard layout fails to load auth.
 * Auto-retries by refreshing the page after a short delay.
 * This handles the case where Clerk session isn't ready yet
 * (e.g., right after sign-up via invitation).
 */
export function AuthRetryWrapper() {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Auto-retry up to 3 times with increasing delay
    if (retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
        router.refresh();
      }, 1500 + retryCount * 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCount, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
        <p className="text-zinc-600 font-medium">جارٍ تحميل حسابك...</p>
        {retryCount > 0 && (
          <p className="text-sm text-zinc-400">
            محاولة {retryCount} من 3...
          </p>
        )}
        {retryCount >= 3 && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            إعادة التحميل
          </button>
        )}
      </div>
    </div>
  );
}
