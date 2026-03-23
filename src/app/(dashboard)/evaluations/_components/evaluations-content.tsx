"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronRight,
  Check,
  ArrowRight,
  ClipboardCheck,
  Heart,
  Trophy,
  X,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  getStudentsWithEvaluations,
  createEvaluation,
  deleteEvaluation,
} from "@/lib/actions/evaluations";
import { toast } from "sonner";

const MONTHS = [
  { value: 1, label: "يناير" }, { value: 2, label: "فبراير" }, { value: 3, label: "مارس" },
  { value: 4, label: "أبريل" }, { value: 5, label: "مايو" }, { value: 6, label: "يونيو" },
  { value: 7, label: "يوليو" }, { value: 8, label: "أغسطس" }, { value: 9, label: "سبتمبر" },
  { value: 10, label: "أكتوبر" }, { value: 11, label: "نوفمبر" }, { value: 12, label: "ديسمبر" },
];

interface StudentWithEval {
  id: string;
  name: string;
  ageGroup: string | null;
  evaluation: {
    id: string;
    grandTotal: number;
    coachInstructions: number | null;
    respectScore: number | null;
    fairPlayScore: number | null;
    technicalProgress: number | null;
    notes: string | null;
  } | null;
}

// New 4-criteria evaluation system (/50 total)
// 1️⃣ الانضباطية (15): تنفيذ تعليمات المدرب
// 2️⃣ الأخلاق (15): احترام (10) + اللعب النظيف (5)
// 3️⃣ المستوى الفني (20): التطور المهاري والأداء البدني
const categories = [
  {
    key: "discipline",
    label: "1️⃣ الانضباطية",
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-600",
    max: 15,
    items: [
      { key: "coachInstructions", label: "تنفيذ تعليمات المدرب", max: 15 },
    ],
  },
  {
    key: "ethics",
    label: "2️⃣ الأخلاق",
    icon: <Heart className="h-4 w-4" />,
    color: "text-rose-600",
    bgColor: "bg-rose-600",
    max: 15,
    items: [
      { key: "respectScore", label: "احترام المدربين والإدارة والزملاء", max: 10 },
      { key: "fairPlayScore", label: "اللعب النظيف والروح الرياضية", max: 5 },
    ],
  },
  {
    key: "technical",
    label: "3️⃣ المستوى الفني",
    icon: <Trophy className="h-4 w-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-600",
    max: 20,
    items: [
      { key: "technicalProgress", label: "التطور المهاري والأداء البدني خلال الشهر", max: 20 },
    ],
  },
];

type ScoreKeys = "coachInstructions" | "respectScore" | "fairPlayScore" | "technicalProgress";

const defaultScores: Record<ScoreKeys, number> = {
  coachInstructions: 10,
  respectScore: 7,
  fairPlayScore: 3,
  technicalProgress: 14,
};

export function EvaluationsContent() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [studentsList, setStudentsList] = useState<StudentWithEval[]>([]);
  const [evaluatedCount, setEvaluatedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Evaluation form state
  const [selectedStudent, setSelectedStudent] = useState<StudentWithEval | null>(null);
  const [scores, setScores] = useState<Record<ScoreKeys, number>>({ ...defaultScores });
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    setLoading(true);
    const result = await getStudentsWithEvaluations(selectedMonth, selectedYear);
    if (result.success && result.students) {
      setStudentsList(result.students as StudentWithEval[]);
      setEvaluatedCount(result.evaluatedCount ?? 0);
      setTotalCount(result.totalCount ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  function openEvalForm(student: StudentWithEval) {
    setSelectedStudent(student);
    if (student.evaluation) {
      // Pre-fill with existing evaluation
      const e = student.evaluation;
      setScores({
        coachInstructions: e.coachInstructions ?? 10,
        respectScore: e.respectScore ?? 7,
        fairPlayScore: e.fairPlayScore ?? 3,
        technicalProgress: e.technicalProgress ?? 14,
      });
      setNotes(e.notes || "");
    } else {
      setScores({ ...defaultScores });
      setNotes("");
    }
  }

  function closeForm() {
    setSelectedStudent(null);
  }

  function setScore(key: ScoreKeys, value: number) {
    setScores(prev => ({ ...prev, [key]: value }));
  }

  const grandTotal = Object.values(scores).reduce((sum, v) => sum + v, 0);

  function handleSubmit() {
    if (!selectedStudent) return;
    if (selectedStudent.evaluation) {
      toast.error("يوجد تقييم لهذا اللاعب بالفعل لهذا الشهر");
      return;
    }
    startTransition(async () => {
      const result = await createEvaluation({
        studentId: selectedStudent.id,
        month: selectedMonth,
        year: selectedYear,
        ...scores,
        notes: notes || undefined,
      });
      if (result.success) {
        toast.success(`تم تقييم ${selectedStudent.name} بنجاح`);
        setSelectedStudent(null);
        loadData();
      } else {
        toast.error(result.error || "فشل في حفظ التقييم");
      }
    });
  }

  // Move to next unevaluated student after submit
  function handleSubmitAndNext() {
    if (!selectedStudent) return;
    startTransition(async () => {
      const result = await createEvaluation({
        studentId: selectedStudent.id,
        month: selectedMonth,
        year: selectedYear,
        ...scores,
        notes: notes || undefined,
      });
      if (result.success) {
        toast.success(`تم تقييم ${selectedStudent.name}`);
        // Find next unevaluated
        const currentIdx = filteredStudents.findIndex(s => s.id === selectedStudent.id);
        const next = filteredStudents.slice(currentIdx + 1).find(s => !s.evaluation);
        if (next) {
          openEvalForm(next);
        } else {
          setSelectedStudent(null);
          toast.info("تم تقييم جميع اللاعبين! 🎉");
        }
        loadData();
      } else {
        toast.error(result.error || "فشل في حفظ التقييم");
      }
    });
  }

  const filteredStudents = search
    ? studentsList.filter(s => s.name.includes(search))
    : studentsList;

  // ===== Evaluation Form View =====
  if (selectedStudent) {
    return (
      <div className="space-y-4">
        {/* Back + Student header */}
        <div className="flex items-center justify-between">
          <button onClick={closeForm} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
            <ArrowRight className="h-4 w-4" /> الرجوع للقائمة
          </button>
          <Badge variant="outline" className="text-sm">
            {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </Badge>
        </div>

        <div className="bg-white rounded-xl border p-4 text-center">
          <h2 className="text-xl font-bold text-zinc-900">{selectedStudent.name}</h2>
          {selectedStudent.ageGroup && (
            <span className="text-sm text-zinc-500">({selectedStudent.ageGroup})</span>
          )}
          {selectedStudent.evaluation && (
            <div className="mt-3 space-y-2">
              <Badge className="bg-amber-100 text-amber-700">تم التقييم مسبقاً</Badge>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 mx-auto text-red-600 border-red-200 hover:bg-red-50"
                disabled={isPending}
                onClick={async () => {
                  if (!confirm("هل أنت متأكد من إعادة تعيين تقييم هذا اللاعب؟")) return;
                  startTransition(async () => {
                    const result = await deleteEvaluation(selectedStudent.evaluation!.id);
                    if (result.success) {
                      toast.success("تم إعادة تعيين التقييم");
                      setSelectedStudent(null);
                      loadData();
                    } else {
                      toast.error(result.error || "فشل في إعادة التعيين");
                    }
                  });
                }}
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                إعادة تعيين
              </Button>
            </div>
          )}
        </div>

        {/* KPI Categories */}
        {categories.map(cat => {
          const catTotal = cat.items.reduce((sum, item) => sum + scores[item.key as ScoreKeys], 0);
          return (
            <Card key={cat.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cat.color}>{cat.icon}</span>
                    {cat.label}
                  </div>
                  <span className="text-base font-bold">{catTotal} / {cat.max}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cat.items.map(item => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-700">{item.label}</span>
                      <span className="text-sm font-semibold text-zinc-900">
                        {scores[item.key as ScoreKeys]} / {item.max}
                      </span>
                    </div>
                    <ScoreSlider
                      value={scores[item.key as ScoreKeys]}
                      max={item.max}
                      onChange={(v) => setScore(item.key as ScoreKeys, v)}
                      readOnly={!!selectedStudent.evaluation}
                      color={cat.bgColor}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Notes */}
        <Card>
          <CardContent className="pt-4">
            <label className="text-sm font-medium block mb-2">ملاحظات المدرب</label>
            <textarea
              className="w-full border border-zinc-200 rounded-lg p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-zinc-300 focus:border-transparent outline-none resize-none"
              placeholder="ملاحظات إضافية عن أداء اللاعب..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              readOnly={!!selectedStudent.evaluation}
            />
          </CardContent>
        </Card>

        {/* Grand Total + Submit */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold">المجموع الكلي</span>
              <span className={`text-3xl font-bold ${grandTotal >= 40 ? "text-emerald-600" : grandTotal >= 25 ? "text-amber-600" : "text-red-600"}`}>
                {grandTotal} <span className="text-lg text-zinc-400">/ 50</span>
              </span>
            </div>

            {/* Category breakdown bar */}
            <div className="flex gap-0.5 rounded-full overflow-hidden h-3 mb-4">
              {categories.map(cat => {
                const catTotal = cat.items.reduce((sum, item) => sum + scores[item.key as ScoreKeys], 0);
                const pct = (catTotal / 50) * 100;
                return <div key={cat.key} className={`${cat.bgColor} transition-all`} style={{ width: `${pct}%` }} title={`${cat.label}: ${catTotal}/${cat.max}`} />;
              })}
            </div>

            {!selectedStudent.evaluation && (
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <Check className="h-4 w-4 ms-2" />}
                  حفظ التقييم
                </Button>
                <Button onClick={handleSubmitAndNext} disabled={isPending} variant="outline" className="flex-1">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <ChevronRight className="h-4 w-4 ms-2 rotate-180" />}
                  حفظ والتالي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== Student List View =====
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">تقييم لاعب الشهر</h1>
      </div>

      {/* Month/Year Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">الشهر</label>
              <select
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">السنة</label>
              <select
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {!loading && (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-zinc-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: totalCount > 0 ? `${(evaluatedCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-sm text-zinc-600 shrink-0">{evaluatedCount} / {totalCount}</span>
        </div>
      )}

      {/* Search */}
      {studentsList.length > 8 && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="بحث عن لاعب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg pr-10 pl-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-zinc-300 focus:border-transparent outline-none"
          />
        </div>
      )}

      {/* Student Cards */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredStudents.map(s => (
            <button
              key={s.id}
              onClick={() => openEvalForm(s)}
              className="w-full bg-white border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-right"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${s.evaluation ? "bg-emerald-500" : "bg-zinc-300"}`} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{s.name}</p>
                  {s.ageGroup && <p className="text-xs text-zinc-400">{s.ageGroup}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.evaluation ? (
                  <Badge variant="secondary" className="text-xs">
                    {s.evaluation.grandTotal} / 50
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-zinc-400">
                    لم يُقيّم
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-zinc-300 rotate-180" />
              </div>
            </button>
          ))}
          {filteredStudents.length === 0 && (
            <p className="text-center text-zinc-400 py-8 text-sm">لا توجد نتائج</p>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Score Slider Component =====
function ScoreSlider({ value, max, onChange, readOnly = false, color }: {
  value: number;
  max: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  color: string;
}) {
  const percentage = (value / max) * 100;
  const bgColorMap: Record<string, string> = {
    "bg-blue-600": "#2563eb",
    "bg-rose-600": "#e11d48",
    "bg-amber-600": "#d97706",
  };
  const bgColorHex = bgColorMap[color] || "#3b82f6";
  
  return (
    <div className="relative">
      <input
        type="range"
        min={1}
        max={max}
        value={value}
        disabled={readOnly}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className={`w-full h-3 rounded-full appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-default
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
          [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-400
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white 
          [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-400 [&::-moz-range-thumb]:rounded-full 
          [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md`}
        style={{
          background: `linear-gradient(to left, ${bgColorHex} ${percentage}%, #e4e4e7 ${percentage}%)`,
        }}
      />
    </div>
  );
}
