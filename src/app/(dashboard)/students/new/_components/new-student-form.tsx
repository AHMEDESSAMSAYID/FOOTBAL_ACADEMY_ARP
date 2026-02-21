"use client";

import { useState, useEffect } from "react";
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
import { createStudent } from "@/lib/actions/students";
import { searchStudents, linkSiblings } from "@/lib/actions/siblings";
import { Search, X, Users, Loader2 } from "lucide-react";

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

export function NewStudentForm() {
  const router = useRouter();
  
  // Sibling selection state
  const [siblingSearch, setSiblingSearch] = useState("");
  const [siblingResults, setSiblingResults] = useState<{ id: string; name: string; membershipNumber: string | null }[]>([]);
  const [selectedSibling, setSelectedSibling] = useState<{ id: string; name: string } | null>(null);
  const [searchingStudents, setSearchingStudents] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      fullName: "",
      status: "trial",
      birthDate: "",
      ageGroup: undefined,
      nationality: "",
      idNumber: "",
      phone: "",
      school: "",
      address: "",
      area: "",
      notes: "",
      registrationDate: new Date().toISOString().split("T")[0],
      registrationFormStatus: "not_filled",
      registrationFormNotes: "",
    },
  });

  async function handleSiblingSearch(query: string) {
    setSiblingSearch(query);
    if (query.length < 2) {
      setSiblingResults([]);
      return;
    }
    setSearchingStudents(true);
    const result = await searchStudents(query);
    if (result.success) {
      setSiblingResults(result.students.map((s) => ({ id: s.id, name: s.name, membershipNumber: s.membershipNumber })));
    }
    setSearchingStudents(false);
  }

  async function onSubmit(values: FormValues) {
    try {
      const result = await createStudent({
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
        registrationFormStatus: values.registrationFormStatus as "filled" | "not_filled" || "not_filled",
        registrationFormNotes: values.registrationFormNotes || undefined,
      });
      
      if (result.success) {
        // Link sibling if selected
        if (selectedSibling && result.student) {
          await linkSiblings(result.student.id, selectedSibling.id);
        }
        toast.success("تم تسجيل اللاعب بنجاح");
        router.push("/students");
      } else {
        toast.error(result.error || "حدث خطأ أثناء التسجيل");
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
                  <FormDescription>يتم تعيينه تلقائياً لتاريخ اليوم</FormDescription>
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
                    <Input placeholder="مثال: مصري" {...field} />
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

        {/* Sibling Linking */}
        <div className="space-y-4">
          <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="h-4 w-4" />
            ربط أخ (اختياري)
          </h3>
          <p className="text-xs text-zinc-500">إذا كان لهذا اللاعب أخ مسجل بالأكاديمية، يمكنك ربطه هنا</p>

          {selectedSibling ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-violet-200 bg-violet-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-200 text-violet-700 text-xs font-bold">
                  {selectedSibling.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{selectedSibling.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400"
                onClick={() => setSelectedSibling(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="ابحث باسم الأخ..."
                  value={siblingSearch}
                  onChange={(e) => handleSiblingSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
              {searchingStudents && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
              )}
              {siblingResults.length > 0 && (
                <div className="space-y-1 max-h-36 overflow-y-auto border rounded-lg p-1">
                  {siblingResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-violet-50 text-start transition-colors"
                      onClick={() => {
                        setSelectedSibling({ id: s.id, name: s.name });
                        setSiblingSearch("");
                        setSiblingResults([]);
                      }}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-zinc-400">{s.membershipNumber}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "جاري التسجيل..." : "تسجيل اللاعب"}
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
