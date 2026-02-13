"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrainingSession } from "@/lib/actions/attendance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated?: (session: { id: string; sessionDate: string; ageGroup: string | null; notes: string | null; createdAt: Date }) => void;
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  onSessionCreated,
}: CreateSessionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ageGroup, setAgeGroup] = useState<"5-10" | "10-15" | "15+">("5-10");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await createTrainingSession({
        date,
        ageGroup,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success("تم إنشاء التدريب بنجاح");
        if (onSessionCreated && result.session) {
          onSessionCreated(result.session);
        } else {
          onOpenChange(false);
          router.refresh();
        }
      } else {
        toast.error(result.error || "حدث خطأ");
      }
    } catch {
      toast.error("فشل في إنشاء التدريب");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تدريب جديد</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">التاريخ</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageGroup">الفئة العمرية</Label>
            <Select value={ageGroup} onValueChange={(v) => setAgeGroup(v as typeof ageGroup)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5-10">٥-١٠ سنوات</SelectItem>
                <SelectItem value="10-15">١٠-١٥ سنة</SelectItem>
                <SelectItem value="15+">١٥+ سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تدريب خاص، بطولة، الخ"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "جاري الإنشاء..." : "إنشاء"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
