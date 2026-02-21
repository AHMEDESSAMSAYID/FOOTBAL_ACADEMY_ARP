"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateStudent } from "@/lib/actions/students";

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  fullName: z.string().optional(),
  status: z.enum(["active", "inactive", "frozen", "trial"]),
  birthDate: z.string().optional(),
  ageGroup: z.enum(["5-10", "10-15", "15+"]).optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  phone: z.string().optional(),
  school: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  notes: z.string().optional(),
  registrationDate: z.string().optional(),
  registrationFormStatus: z.enum(["filled", "not_filled"]).optional(),
  registrationFormNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditStudentFormProps {
  studentId: string;
  student: {
    name: string;
    fullName: string | null;
    status: string;
    birthDate: string | null;
    ageGroup: string | null;
    nationality: string | null;
    idNumber: string | null;
    phone: string | null;
    school: string | null;
    address: string | null;
    area: string | null;
    notes: string | null;
    registrationDate: string;
    registrationFormStatus: string | null;
    registrationFormNotes: string | null;
  };
}

export function EditStudentForm({ studentId, student }: EditStudentFormProps) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student.name,
      fullName: student.fullName || "",
      status: student.status as "active" | "inactive" | "frozen" | "trial",
      birthDate: student.birthDate || "",
      ageGroup: (student.ageGroup as "5-10" | "10-15" | "15+") || undefined,
      nationality: student.nationality || "",
      idNumber: student.idNumber || "",
      phone: student.phone || "",
      school: student.school || "",
      address: student.address || "",
      area: student.area || "",
      notes: student.notes || "",
      registrationDate: student.registrationDate || "",
      registrationFormStatus: (student.registrationFormStatus as "filled" | "not_filled") || "not_filled",
      registrationFormNotes: student.registrationFormNotes || "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const result = await updateStudent(studentId, {
        name: values.name,
        fullName: values.fullName || undefined,
        status: values.status,
        birthDate: values.birthDate || undefined,
        ageGroup: values.ageGroup,
        nationality: values.nationality || undefined,
        idNumber: values.idNumber || undefined,
        phone: values.phone || undefined,
        school: values.school || undefined,
        address: values.address || undefined,
        area: values.area || undefined,
        notes: values.notes || undefined,
        registrationDate: values.registrationDate || undefined,
        registrationFormStatus: values.registrationFormStatus as "filled" | "not_filled" || undefined,
        registrationFormNotes: values.registrationFormNotes ?? undefined,
      });

      if (result.success) {
        toast.success("تم تحديث بيانات اللاعب بنجاح");
        router.push(`/students/${studentId}`);
      } else {
        toast.error(result.error || "حدث خطأ أثناء التحديث");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-zinc-900">المعلومات الأساسية</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم *</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم اللاعب" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم الرباعي" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحالة *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="trial">تجريبي</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="frozen">مجمد</SelectItem>
                      <SelectItem value="inactive">متوقف</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفئة العمرية</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5-10">تحت ١٠ سنوات</SelectItem>
                      <SelectItem value="10-15">١٠-١٥ سنة</SelectItem>
                      <SelectItem value="15+">فوق ١٥ سنة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ الميلاد</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ التسجيل</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الجنسية</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: سوري" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-zinc-900">معلومات التواصل</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                      className="text-left"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    رقم هاتف اللاعب (إن وجد)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المنطقة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: بشاك شهير" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Input placeholder="العنوان بالكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-zinc-900">معلومات إضافية</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهوية</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="رقم الهوية أو جواز السفر"
                      dir="ltr"
                      className="text-left"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المدرسة</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم المدرسة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Input placeholder="أي ملاحظات إضافية..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Registration Form Status */}
        <div className="space-y-4">
          <h3 className="font-semibold text-zinc-900">استمارة التسجيل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="registrationFormStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حالة الاستمارة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر حالة الاستمارة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="filled">مكتمل ✅</SelectItem>
                      <SelectItem value="not_filled">غير مكتمل ❌</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>هل سلّم ولي الأمر استمارة التسجيل الورقية؟</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationFormNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات الاستمارة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: ناقص توقيع، بيانات غير مكتملة..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Form>
  );
}
