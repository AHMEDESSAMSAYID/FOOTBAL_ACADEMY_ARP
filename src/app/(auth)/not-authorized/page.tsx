"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function NotAuthorizedPage() {
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  // Auto sign-out after a short delay to prevent loop
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut({ redirectUrl: "/sign-in" });
    }, 5000);
    return () => clearTimeout(timer);
  }, [signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <ShieldAlert className="h-16 w-16 mx-auto text-red-500" />
        <h1 className="text-2xl font-bold text-red-700">غير مصرح بالدخول</h1>
        <p className="text-zinc-600">
          هذا الحساب غير مدعو للنظام. يرجى التواصل مع المدير للحصول على دعوة.
        </p>
        <p className="text-sm text-zinc-400">
          سيتم تسجيل خروجك تلقائياً خلال 5 ثوانٍ...
        </p>
        <Button
          variant="outline"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            signOut({ redirectUrl: "/sign-in" });
          }}
        >
          {signingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج الآن"}
        </Button>
      </div>
    </div>
  );
}
