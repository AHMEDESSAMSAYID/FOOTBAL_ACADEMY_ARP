import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { StudentsTable } from "./_components/students-table";
import { getStudents } from "@/lib/actions/students";

export default async function StudentsPage() {
  const result = await getStudents();
  const allStudents = result.students || [];

  const totalStudents = allStudents.length;
  const activeCount = allStudents.filter(s => s.status === "active").length;
  const trialCount = allStudents.filter(s => s.status === "trial").length;
  const inactiveCount = allStudents.filter(s => s.status === "inactive" || s.status === "frozen").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">اللاعبين</h1>
          <p className="text-sm text-zinc-500">إدارة سجل اللاعبين والطلاب</p>
        </div>
        <Button asChild>
          <Link href="/students/new">
            <span className="ml-2">➕</span>
            تسجيل لاعب جديد
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>إجمالي اللاعبين</CardDescription>
            <CardTitle className="text-2xl">{totalStudents}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>نشط</CardDescription>
            <CardTitle className="text-2xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>تجريبي</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{trialCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>متوقف</CardDescription>
            <CardTitle className="text-2xl text-zinc-400">{inactiveCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>قائمة اللاعبين</CardTitle>
          <CardDescription>جميع اللاعبين المسجلين في الأكاديمية</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentsTable students={allStudents} />
        </CardContent>
      </Card>
    </div>
  );
}
