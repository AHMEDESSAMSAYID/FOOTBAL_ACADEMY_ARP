"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Search, User, DollarSign } from "lucide-react";
import { getStudents } from "@/lib/actions/students";

type Student = {
  id: string;
  name: string;
  membershipNumber: string | null;
  status: string;
  ageGroup: string | null;
};

export default function NewPaymentPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getStudents();
      if (result.success) {
        setStudents(
          result.students.map((s) => ({
            id: s.id,
            name: s.name,
            membershipNumber: s.membershipNumber,
            status: s.status,
            ageGroup: s.ageGroup,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.membershipNumber && s.membershipNumber.includes(search))
  );

  const statusLabel: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    frozen: "مجمد",
    trial: "تجربة",
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-zinc-100 text-zinc-600",
    frozen: "bg-red-100 text-red-700",
    trial: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/payments">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تسجيل دفعة جديدة</h1>
          <p className="text-sm text-zinc-500">اختر اللاعب لتسجيل دفعة له</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="ابحث بالاسم أو رقم العضوية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 bg-white"
        />
      </div>

      {/* Students List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          {search ? "لا توجد نتائج" : "لا يوجد لاعبين مسجلين"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((student) => (
            <Card
              key={student.id}
              className="bg-white hover:bg-zinc-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/students/${student.id}/payment`)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{student.name}</p>
                  <p className="text-xs text-zinc-400">
                    {student.membershipNumber || "بدون رقم عضوية"}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColor[student.status] || ""}
                >
                  {statusLabel[student.status] || student.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
