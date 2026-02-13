import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewStudentForm } from "./_components/new-student-form";

export default function NewStudentPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تسجيل لاعب جديد</h1>
        <p className="text-sm text-zinc-500">
          أدخل بيانات اللاعب الجديد للتسجيل في الأكاديمية
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>بيانات اللاعب</CardTitle>
          <CardDescription>
            الحقول المميزة بعلامة * مطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewStudentForm />
        </CardContent>
      </Card>
    </div>
  );
}
