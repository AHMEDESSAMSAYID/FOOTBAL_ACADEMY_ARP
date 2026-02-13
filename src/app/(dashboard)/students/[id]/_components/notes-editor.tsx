"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateStudentNotes } from "@/lib/actions/students";
import { toast } from "sonner";
import { Pencil, Save, X, Loader2 } from "lucide-react";

interface NotesEditorProps {
  studentId: string;
  initialNotes: string | null;
}

export function NotesEditor({ studentId, initialNotes }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateStudentNotes(studentId, notes);
      if (result.success) {
        toast.success("تم حفظ الملاحظات");
        setIsEditing(false);
      } else {
        toast.error(result.error || "فشل في حفظ الملاحظات");
      }
    });
  };

  const handleCancel = () => {
    setNotes(initialNotes || "");
    setIsEditing(false);
  };

  return (
    <Card className="bg-white md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">ملاحظات</CardTitle>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4 ms-2" />
            {notes ? "تعديل" : "إضافة ملاحظة"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات عن اللاعب..."
              rows={4}
              className="resize-none"
              disabled={isPending}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="h-4 w-4 ms-2" />
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 ms-2" />
                )}
                حفظ
              </Button>
            </div>
          </div>
        ) : notes ? (
          <p className="text-sm text-zinc-600 whitespace-pre-wrap">{notes}</p>
        ) : (
          <p className="text-sm text-zinc-400">لا توجد ملاحظات</p>
        )}
      </CardContent>
    </Card>
  );
}
