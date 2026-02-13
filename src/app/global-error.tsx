"use client";

import { IBM_Plex_Sans_Arabic } from "next/font/google";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${ibmPlexArabic.variable} font-arabic antialiased`}>
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-3xl">🚨</span>
              </div>
              <h1 className="text-xl font-bold text-zinc-900">
                خطأ حرج في النظام
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                حدث خطأ غير متوقع. يرجى تحديث الصفحة أو المحاولة لاحقاً.
              </p>
            </div>
            
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 rounded-lg bg-zinc-100 p-3">
                <p className="text-xs text-zinc-500 font-mono break-all">
                  {error.message}
                </p>
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={reset}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                حاول مرة أخرى
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
