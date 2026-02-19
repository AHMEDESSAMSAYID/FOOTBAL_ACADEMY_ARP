import { notFound } from "next/navigation";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditStudentForm } from "./_components/edit-student-form";

interface EditStudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params;

  const student = await db.query.students.findFirst({
    where: eq(students.id, id),
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">تعديل بيانات اللاعب</h1>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>تعديل: {student.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditStudentForm
            studentId={id}
            student={{
              name: student.name,
              fullName: student.fullName,
              status: student.status,
              birthDate: student.birthDate,
              ageGroup: student.ageGroup,
              nationality: student.nationality,
              idNumber: student.idNumber,
              phone: student.phone,
              school: student.school,
              address: student.address,
              area: student.area,
              notes: student.notes,
              registrationDate: student.registrationDate,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
