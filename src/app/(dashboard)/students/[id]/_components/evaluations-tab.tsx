"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { 
  Star, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ClipboardCheck,
  Heart,
  Trophy,
} from "lucide-react";
import { createEvaluation, getStudentEvaluations } from "@/lib/actions/evaluations";
import { toast } from "sonner";

interface EvaluationsTabProps {
  studentId: string;
}

interface Evaluation {
  id: string;
  month: number;
  year: number;
  // New fields
  coachInstructions: number | null;
  respectScore: number | null;
  fairPlayScore: number | null;
  technicalProgress: number | null;
  // Legacy fields
  ballControl: number | null;
  passing: number | null;
  shooting: number | null;
  speed: number | null;
  fitness: number | null;
  positioning: number | null;
  gameAwareness: number | null;
  commitment: number | null;
  teamwork: number | null;
  discipline: number | null;
  grandTotal: number;
  notes: string | null;
  createdAt: Date;
}

const monthNames = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

// New evaluation categories
const categories = [
  {
    key: "discipline",
    label: "الانضباطية",
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-100",
    max: 15,
    items: [
      { key: "coachInstructions", label: "تنفيذ تعليمات المدرب", max: 15 },
    ],
  },
  {
    key: "ethics",
    label: "الأخلاق",
    icon: <Heart className="h-4 w-4" />,
    color: "text-pink-600 bg-pink-100",
    max: 15,
    items: [
      { key: "respectScore", label: "احترام المدربين والإدارة والزملاء", max: 10 },
      { key: "fairPlayScore", label: "اللعب النظيف والروح الرياضية", max: 5 },
    ],
  },
  {
    key: "technical",
    label: "المستوى الفني",
    icon: <Trophy className="h-4 w-4" />,
    color: "text-amber-600 bg-amber-100",
    max: 20,
    items: [
      { key: "technicalProgress", label: "التطور المهاري والأداء البدني", max: 20 },
    ],
  },
];

function ScoreSlider({ 
  value, 
  onChange, 
  max, 
  label 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  max: number;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600">{label}</span>
        <span className="text-sm font-bold text-zinc-900">{value}/{max}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v: number[]) => onChange(v[0])}
        min={1}
        max={max}
        step={1}
        className="w-full"
      />
    </div>
  );
}

function getTrend(evaluations: Evaluation[]): "up" | "down" | "stable" | null {
  if (evaluations.length < 2) return null;
  const latest = evaluations[0].grandTotal;
  const previous = evaluations[1].grandTotal;
  if (latest > previous) return "up";
  if (latest < previous) return "down";
  return "stable";
}

function isNewSystem(eval_: Evaluation): boolean {
  return eval_.coachInstructions !== null;
}

export function EvaluationsTab({ studentId }: EvaluationsTabProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [coachInstructions, setCoachInstructions] = useState(8);
  const [respectScore, setRespectScore] = useState(5);
  const [fairPlayScore, setFairPlayScore] = useState(3);
  const [technicalProgress, setTechnicalProgress] = useState(10);
  const [notes, setNotes] = useState("");

  const grandTotal = coachInstructions + respectScore + fairPlayScore + technicalProgress;

  useEffect(() => {
    async function fetchData() {
      const result = await getStudentEvaluations(studentId);
      if (result.success) {
        setEvaluations(result.evaluations as Evaluation[]);
      }
      setLoading(false);
    }
    fetchData();
  }, [studentId]);

  function resetForm() {
    setCoachInstructions(8);
    setRespectScore(5);
    setFairPlayScore(3);
    setTechnicalProgress(10);
    setNotes("");
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createEvaluation({
        studentId,
        month: parseInt(month),
        year: parseInt(year),
        coachInstructions,
        respectScore,
        fairPlayScore,
        technicalProgress,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success("تم حفظ التقييم بنجاح");
        setDialogOpen(false);
        const refreshResult = await getStudentEvaluations(studentId);
        if (refreshResult.success) {
          setEvaluations(refreshResult.evaluations as Evaluation[]);
        }
        resetForm();
      } else {
        toast.error(result.error || "فشل في حفظ التقييم");
      }
    });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-zinc-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const trend = getTrend(evaluations);

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {trend === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
          {trend === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
          {trend === "stable" && <Minus className="h-5 w-5 text-zinc-500" />}
          {trend && (
            <span className={`text-sm font-medium ${
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-zinc-500"
            }`}>
              {trend === "up" ? "تحسن" : trend === "down" ? "تراجع" : "مستقر"}
            </span>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ms-2" />
              تقييم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تقييم لاعب الشهر</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-2">
              {/* Month/Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الشهر</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {monthNames.slice(1).map((name, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>السنة</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Criteria */}
              {categories.map(cat => (
                <Card key={cat.key}>
                  <CardHeader className="py-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span className={`p-1.5 rounded ${cat.color}`}>{cat.icon}</span>
                      {cat.label}
                      <span className="mr-auto text-xs font-normal text-zinc-500">/{cat.max}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {cat.items.map(item => {
                      const value = item.key === "coachInstructions" ? coachInstructions
                        : item.key === "respectScore" ? respectScore
                        : item.key === "fairPlayScore" ? fairPlayScore
                        : technicalProgress;
                      const setValue = item.key === "coachInstructions" ? setCoachInstructions
                        : item.key === "respectScore" ? setRespectScore
                        : item.key === "fairPlayScore" ? setFairPlayScore
                        : setTechnicalProgress;
                      return (
                        <ScoreSlider
                          key={item.key}
                          value={value}
                          onChange={setValue}
                          max={item.max}
                          label={item.label}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              ))}

              {/* Notes */}
              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية عن أداء اللاعب..."
                  rows={3}
                />
              </div>

              <div className="text-center text-lg font-bold text-zinc-800">
                المجموع: {grandTotal} / 50
              </div>

              <Button onClick={handleSubmit} disabled={isPending} className="w-full">
                {isPending ? "جاري الحفظ..." : "حفظ التقييم"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Evaluations List */}
      {evaluations.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <Star className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
          <p>لا يوجد تقييمات بعد</p>
          <p className="text-xs">أضف أول تقييم شهري للاعب</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((eval_) => (
            <Card key={eval_.id} className="bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {monthNames[eval_.month]} {eval_.year}
                  </CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {eval_.grandTotal} / 50
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {isNewSystem(eval_) ? (
                  // New 4-criteria system
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-blue-50">
                      <div className="text-xs text-blue-600 mb-1">الانضباطية</div>
                      <div className="font-bold text-sm">{eval_.coachInstructions}/15</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-pink-50">
                      <div className="text-xs text-pink-600 mb-1">الأخلاق</div>
                      <div className="font-bold text-sm">{(eval_.respectScore ?? 0) + (eval_.fairPlayScore ?? 0)}/15</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50">
                      <div className="text-xs text-amber-600 mb-1">المستوى الفني</div>
                      <div className="font-bold text-sm">{eval_.technicalProgress}/20</div>
                    </div>
                  </div>
                ) : (
                  // Legacy 10-KPI system
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-2 rounded-lg bg-blue-50">
                      <div className="text-xs text-blue-600 mb-1">التقنية</div>
                      <div className="font-bold text-sm">
                        {(eval_.ballControl ?? 0) + (eval_.passing ?? 0) + (eval_.shooting ?? 0)}/15
                      </div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50">
                      <div className="text-xs text-green-600 mb-1">البدنية</div>
                      <div className="font-bold text-sm">
                        {(eval_.speed ?? 0) + (eval_.fitness ?? 0)}/10
                      </div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-purple-50">
                      <div className="text-xs text-purple-600 mb-1">التكتيكية</div>
                      <div className="font-bold text-sm">
                        {(eval_.positioning ?? 0) + (eval_.gameAwareness ?? 0)}/10
                      </div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-50">
                      <div className="text-xs text-red-600 mb-1">السلوك</div>
                      <div className="font-bold text-sm">
                        {(eval_.commitment ?? 0) + (eval_.teamwork ?? 0) + (eval_.discipline ?? 0)}/15
                      </div>
                    </div>
                  </div>
                )}
                {eval_.notes && (
                  <p className="text-xs text-zinc-600 bg-zinc-50 rounded p-2 mt-2">{eval_.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
