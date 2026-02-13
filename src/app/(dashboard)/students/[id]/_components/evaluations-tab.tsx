"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Star, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Trophy,
  Dumbbell,
  Brain,
  Heart,
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
  ballControl: number;
  passing: number;
  shooting: number;
  speed: number;
  fitness: number;
  positioning: number;
  gameAwareness: number;
  commitment: number;
  teamwork: number;
  discipline: number;
  grandTotal: number;
  notes: string | null;
  createdAt: Date;
}

const categoryConfig = [
  {
    key: "technical",
    label: "التقنية",
    icon: <Trophy className="h-4 w-4" />,
    color: "text-blue-600",
    items: [
      { key: "ballControl", label: "التحكم بالكرة" },
      { key: "passing", label: "التمرير" },
      { key: "shooting", label: "التسديد" },
    ],
    max: 15,
  },
  {
    key: "physical",
    label: "البدنية",
    icon: <Dumbbell className="h-4 w-4" />,
    color: "text-green-600",
    items: [
      { key: "speed", label: "السرعة" },
      { key: "fitness", label: "اللياقة" },
    ],
    max: 10,
  },
  {
    key: "tactical",
    label: "التكتيكية",
    icon: <Brain className="h-4 w-4" />,
    color: "text-purple-600",
    items: [
      { key: "positioning", label: "التمركز" },
      { key: "gameAwareness", label: "الوعي بالملعب" },
    ],
    max: 10,
  },
  {
    key: "attitude",
    label: "السلوك",
    icon: <Heart className="h-4 w-4" />,
    color: "text-red-600",
    items: [
      { key: "commitment", label: "الالتزام" },
      { key: "teamwork", label: "العمل الجماعي" },
      { key: "discipline", label: "الانضباط" },
    ],
    max: 15,
  },
];

const ratingLabels = ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"];

const monthNames = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

type ScoreKey = "ballControl" | "passing" | "shooting" | "speed" | "fitness" | "positioning" | "gameAwareness" | "commitment" | "teamwork" | "discipline";

function StarRating({ value, onChange, readOnly = false }: { 
  value: number; 
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readOnly ? "cursor-default" : "cursor-pointer hover:text-amber-400"}`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300"
            }`}
          />
        </button>
      ))}
      <span className="text-xs text-zinc-500 ms-2">{ratingLabels[value]}</span>
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

export function EvaluationsTab({ studentId }: EvaluationsTabProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    ballControl: 3, passing: 3, shooting: 3,
    speed: 3, fitness: 3,
    positioning: 3, gameAwareness: 3,
    commitment: 3, teamwork: 3, discipline: 3,
  });
  const [notes, setNotes] = useState("");

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

  function setScore(key: ScoreKey, value: number) {
    setScores(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createEvaluation({
        studentId,
        month: parseInt(month),
        year: parseInt(year),
        ...scores,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success("تم حفظ التقييم بنجاح");
        setDialogOpen(false);
        const refreshResult = await getStudentEvaluations(studentId);
        if (refreshResult.success) {
          setEvaluations(refreshResult.evaluations as Evaluation[]);
        }
        // Reset form
        setScores({
          ballControl: 3, passing: 3, shooting: 3,
          speed: 3, fitness: 3,
          positioning: 3, gameAwareness: 3,
          commitment: 3, teamwork: 3, discipline: 3,
        });
        setNotes("");
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
              <DialogTitle>تقييم شهري جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
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

              {/* KPI Categories */}
              {categoryConfig.map(cat => (
                <div key={cat.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cat.color}>{cat.icon}</span>
                    <Label className="text-sm font-bold">{cat.label}</Label>
                  </div>
                  <div className="space-y-2 ps-1">
                    {cat.items.map(item => (
                      <div key={item.key}>
                        <Label className="text-xs text-zinc-600">{item.label}</Label>
                        <StarRating
                          value={scores[item.key as ScoreKey]}
                          onChange={(v) => setScore(item.key as ScoreKey, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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

              <div className="text-center text-sm font-bold text-zinc-600">
                المجموع: {Object.values(scores).reduce((s, v) => s + v, 0)} / 50
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categoryConfig.map(cat => {
                    const catTotal = cat.items.reduce((sum, item) => sum + (eval_[item.key as keyof Evaluation] as number), 0);
                    return (
                      <div key={cat.key} className="text-center">
                        <div className={`text-xs mb-1 ${cat.color}`}>{cat.icon}</div>
                        <div className="text-xs text-zinc-500">{cat.label}</div>
                        <div className="font-bold text-sm">{catTotal}/{cat.max}</div>
                      </div>
                    );
                  })}
                </div>
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
