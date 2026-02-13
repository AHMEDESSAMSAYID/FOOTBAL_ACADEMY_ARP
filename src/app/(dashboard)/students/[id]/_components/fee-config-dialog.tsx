"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertFeeConfig } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Settings2, Loader2 } from "lucide-react";

interface FeeConfig {
  monthlyFee: string;
  busFee: string | null;
  uniformPrice: string | null;
  uniformPaid: boolean | null;
  discountType: "fixed" | "percentage" | "sibling" | "other" | null;
  discountAmount: string | null;
  discountReason: string | null;
}

interface FeeConfigDialogProps {
  studentId: string;
  existingConfig?: FeeConfig | null;
}

export function FeeConfigDialog({ studentId, existingConfig }: FeeConfigDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const [monthlyFee, setMonthlyFee] = useState(existingConfig?.monthlyFee || "");
  const [busFee, setBusFee] = useState(existingConfig?.busFee || "");
  const [uniformPrice, setUniformPrice] = useState(existingConfig?.uniformPrice || "");
  const [uniformPaid, setUniformPaid] = useState(existingConfig?.uniformPaid || false);
  const [discountType, setDiscountType] = useState<string>(existingConfig?.discountType || "");
  const [discountAmount, setDiscountAmount] = useState(existingConfig?.discountAmount || "");
  const [discountReason, setDiscountReason] = useState(existingConfig?.discountReason || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monthlyFee || parseFloat(monthlyFee) <= 0) {
      toast.error("يرجى إدخال الاشتراك الشهري");
      return;
    }

    startTransition(async () => {
      const result = await upsertFeeConfig({
        studentId,
        monthlyFee: parseFloat(monthlyFee),
        busFee: busFee ? parseFloat(busFee) : undefined,
        uniformPrice: uniformPrice ? parseFloat(uniformPrice) : undefined,
        uniformPaid,
        discountType: discountType && discountType !== "" ? discountType as "fixed" | "percentage" | "sibling" | "other" : undefined,
        discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
        discountReason: discountReason || undefined,
      });

      if (result.success) {
        toast.success("تم حفظ الرسوم");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "فشل في حفظ الرسوم");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 ms-2" />
          {existingConfig ? "تعديل الرسوم" : "تكوين الرسوم"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>تكوين الرسوم الشهرية</DialogTitle>
            <DialogDescription>
              حدد الرسوم الشهرية والخصومات لهذا اللاعب
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Monthly Fee */}
            <div className="grid gap-2">
              <Label htmlFor="monthlyFee">الاشتراك الشهري (ج.م) *</Label>
              <Input
                id="monthlyFee"
                type="number"
                min="0"
                step="0.01"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="1000"
                dir="ltr"
                required
              />
            </div>

            {/* Bus Fee */}
            <div className="grid gap-2">
              <Label htmlFor="busFee">رسوم الباص (ج.م)</Label>
              <Input
                id="busFee"
                type="number"
                min="0"
                step="0.01"
                value={busFee}
                onChange={(e) => setBusFee(e.target.value)}
                placeholder="500"
                dir="ltr"
              />
            </div>

            {/* Uniform */}
            <div className="grid gap-2">
              <Label htmlFor="uniformPrice">سعر الزي الرسمي (ج.م)</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="uniformPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={uniformPrice}
                  onChange={(e) => setUniformPrice(e.target.value)}
                  placeholder="300"
                  dir="ltr"
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="uniformPaid"
                    checked={uniformPaid}
                    onCheckedChange={(checked) => setUniformPaid(checked === true)}
                  />
                  <Label htmlFor="uniformPaid" className="text-sm">مدفوع</Label>
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">الخصم (اختياري)</h4>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discountType">نوع الخصم</Label>
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger id="discountType">
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                        <SelectItem value="percentage">نسبة مئوية</SelectItem>
                        <SelectItem value="sibling">خصم أخوة</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discountAmount">
                      قيمة الخصم {discountType === "percentage" ? "(%)" : "(ج.م)"}
                    </Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      placeholder="0"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="discountReason">سبب الخصم</Label>
                  <Textarea
                    id="discountReason"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="مثال: خصم أخوة - أخ اللاعب أحمد..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              حفظ الرسوم
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
