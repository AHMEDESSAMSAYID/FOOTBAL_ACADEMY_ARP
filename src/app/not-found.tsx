import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold text-zinc-300">٤٠٤</h1>
      <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
      <p className="mt-2 text-zinc-500">
        عذراً، الصفحة التي تبحث عنها غير موجودة.
      </p>
      <Link href="/" className="mt-6">
        <Button>العودة للرئيسية</Button>
      </Link>
    </div>
  );
}
