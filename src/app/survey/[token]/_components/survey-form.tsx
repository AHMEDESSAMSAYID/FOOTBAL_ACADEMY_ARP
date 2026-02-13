"use client";

import { useEffect, useState, useTransition } from "react";
import { getSurveyByToken, submitParentEvaluation } from "@/lib/actions/parent-surveys";
import { CheckCircle2, Search, ChevronRight } from "lucide-react";

interface SurveyFormProps {
  token: string;
}

interface StudentOption {
  id: string;
  name: string;
  ageGroup: string | null;
  alreadySubmitted: boolean;
}

interface SurveyInfo {
  id: string;
  title: string;
  month: number;
  year: number;
  monthName: string;
}

export function SurveyForm({ token }: SurveyFormProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<SurveyInfo | null>(null);
  const [studentsList, setStudentsList] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form scores
  const [prayer, setPrayer] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [healthyEating, setHealthyEating] = useState(0);
  const [respectOthers, setRespectOthers] = useState(0);
  const [angerControl, setAngerControl] = useState(0);
  const [prepareBag, setPrepareBag] = useState(0);
  const [organizePersonal, setOrganizePersonal] = useState(0);
  const [fulfillRequests, setFulfillRequests] = useState(0);
  const [parentNotes, setParentNotes] = useState("");

  useEffect(() => {
    async function load() {
      const result = await getSurveyByToken(token);
      if (result.success && result.survey && result.students) {
        setSurvey(result.survey);
        setStudentsList(result.students);
      } else {
        setError(result.error || "رابط غير صالح");
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const disciplineTotal = prayer + sleep + healthyEating;
  const moralsTotal = respectOthers + angerControl;
  const homeTotal = prepareBag + organizePersonal + fulfillRequests;
  const grandTotal = disciplineTotal + moralsTotal + homeTotal;

  async function handleSubmit() {
    if (!selectedStudent) return;
    setError(null);
    startTransition(async () => {
      const result = await submitParentEvaluation({
        surveyToken: token,
        studentId: selectedStudent.id,
        prayer, sleep, healthyEating,
        respectOthers, angerControl,
        prepareBag, organizePersonal, fulfillRequests,
        parentNotes: parentNotes || undefined,
      });
      if (result.success) {
        setSubmitted(true);
        setFinalScore(result.grandTotal ?? grandTotal);
      } else {
        setError(result.error || "فشل في الإرسال");
      }
    });
  }

  // ===== Loading =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-zinc-400">جاري التحميل...</div>
      </div>
    );
  }

  // ===== Error / Invalid link =====
  if (error && !survey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-red-600 mb-2">خطأ</h1>
        <p className="text-zinc-600">{error}</p>
      </div>
    );
  }

  // ===== Success =====
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-emerald-700 mb-2">تم إرسال التقييم بنجاح!</h1>
          <p className="text-zinc-500 mb-1">{selectedStudent?.name}</p>
          <p className="text-zinc-400 text-sm mb-4">شكراً لتعاونكم</p>
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-zinc-500">المجموع</p>
            <p className="text-3xl font-bold text-emerald-700">{finalScore} <span className="text-lg">/ 50</span></p>
          </div>
          <button
            onClick={() => {
              setSelectedStudent(null);
              setSubmitted(false);
              setFinalScore(null);
              setPrayer(0); setSleep(0); setHealthyEating(0);
              setRespectOthers(0); setAngerControl(0);
              setPrepareBag(0); setOrganizePersonal(0); setFulfillRequests(0);
              setParentNotes("");
              // Refresh submitted status
              getSurveyByToken(token).then(r => {
                if (r.success && r.students) setStudentsList(r.students);
              });
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            تقييم لاعب آخر
          </button>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  // ===== Step 1: Pick child =====
  if (!selectedStudent) {
    const filtered = search
      ? studentsList.filter(s => s.name.includes(search))
      : studentsList;

    return (
      <div className="max-w-lg mx-auto p-4 pb-8">
        {/* Header */}
        <div className="bg-[#1a3a5c] text-white rounded-2xl p-6 text-center mb-6">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-lg font-bold mb-1">ESPAÑOLA</h1>
          <div className="text-sm opacity-80">{survey.title}</div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <p className="font-bold text-[#1a3a5c] mb-3 text-center">اختر اسم ابنك</p>
          {studentsList.length > 8 && (
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg pr-10 pl-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent outline-none"
              />
            </div>
          )}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filtered.map(s => (
              <button
                key={s.id}
                disabled={s.alreadySubmitted}
                onClick={() => setSelectedStudent(s)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-right transition-colors ${
                  s.alreadySubmitted
                    ? "bg-zinc-50 text-zinc-400 cursor-not-allowed"
                    : "hover:bg-blue-50 active:bg-blue-100"
                }`}
              >
                <div>
                  <span className="font-medium text-sm">{s.name}</span>
                  {s.ageGroup && <span className="text-xs text-zinc-400 mr-2">({s.ageGroup})</span>}
                </div>
                {s.alreadySubmitted ? (
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> تم التقييم
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-300 rotate-180" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-zinc-400 py-4 text-sm">لا توجد نتائج</p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-4">
          ESPAÑOLA Academy © {survey.year}
        </p>
      </div>
    );
  }

  // ===== Step 2: Evaluation form =====
  return (
    <div className="max-w-lg mx-auto p-4 pb-8">
      {/* Header */}
      <div className="bg-[#1a3a5c] text-white rounded-2xl p-6 text-center mb-6">
        <div className="text-4xl mb-2">⚽</div>
        <h1 className="text-lg font-bold mb-1">ESPAÑOLA</h1>
        <div className="text-sm opacity-80">
          تقييم شهر {survey.monthName} ({survey.year})
        </div>
      </div>

      {/* Player Name + Back */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-sm text-zinc-500 mb-1">اسم اللاعب</p>
            <p className="text-xl font-bold text-[#1a3a5c]">{selectedStudent.name}</p>
          </div>
          <button
            onClick={() => setSelectedStudent(null)}
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            تغيير
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-center text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Section 1: الانضباط */}
      <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
        <div className="bg-[#1a3a5c] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚙️</span>
            <span className="font-bold">الانضباط</span>
          </div>
          <span className="text-sm opacity-80">20 درجة</span>
        </div>
        <div className="p-4 space-y-4">
          <ScoreInput label="المحافظة على الصلاة" max={10} value={prayer} onChange={setPrayer} />
          <ScoreInput label="النوم المنتظم" max={5} value={sleep} onChange={setSleep} />
          <ScoreInput label="الأكل الصحي" max={5} value={healthyEating} onChange={setHealthyEating} />
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-zinc-500">المجموع</span>
            <span className="font-bold text-[#1a3a5c] text-lg">{disciplineTotal} / 20</span>
          </div>
        </div>
      </div>

      {/* Section 2: الأخلاق */}
      <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
        <div className="bg-[#1a3a5c] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🌟</span>
            <span className="font-bold">الأخلاق</span>
          </div>
          <span className="text-sm opacity-80">20 درجة</span>
        </div>
        <div className="p-4 space-y-4">
          <ScoreInput label="احترام الوالدين والآخرين" max={10} value={respectOthers} onChange={setRespectOthers} />
          <ScoreInput label="التحكم في العصبية" max={10} value={angerControl} onChange={setAngerControl} />
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-zinc-500">المجموع</span>
            <span className="font-bold text-[#1a3a5c] text-lg">{moralsTotal} / 20</span>
          </div>
        </div>
      </div>

      {/* Section 3: المساهمة المنزلية */}
      <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
        <div className="bg-[#1a3a5c] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span className="font-bold">المساهمة المنزلية</span>
          </div>
          <span className="text-sm opacity-80">10 درجات</span>
        </div>
        <div className="p-4 space-y-4">
          <ScoreInput label="تجهيز الشنطة والزي" max={2} value={prepareBag} onChange={setPrepareBag} />
          <ScoreInput label="ترتيب وتنظيم الأغراض الشخصية" max={3} value={organizePersonal} onChange={setOrganizePersonal} />
          <ScoreInput label="تلبية طلبات الوالدين" max={5} value={fulfillRequests} onChange={setFulfillRequests} />
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-zinc-500">المجموع</span>
            <span className="font-bold text-[#1a3a5c] text-lg">{homeTotal} / 10</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm mb-4 p-4">
        <label className="text-sm font-medium text-zinc-700 block mb-2">ملاحظات ولي الأمر (اختياري)</label>
        <textarea
          className="w-full border border-zinc-200 rounded-lg p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent outline-none resize-none"
          placeholder="أي ملاحظات تود إضافتها..."
          value={parentNotes}
          onChange={(e) => setParentNotes(e.target.value)}
        />
      </div>

      {/* Grand Total */}
      <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#1a3a5c]">مجموع الشهر</span>
          <div className="text-left">
            <span className={`text-3xl font-bold ${grandTotal >= 40 ? "text-emerald-600" : grandTotal >= 25 ? "text-amber-600" : "text-red-600"}`}>
              {grandTotal}
            </span>
            <span className="text-zinc-400 text-lg mr-1">/ 50</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-[#1a3a5c] text-white font-bold py-4 rounded-xl text-lg hover:bg-[#152e4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "جاري الإرسال..." : "إرسال التقييم"}
      </button>

      <p className="text-center text-xs text-zinc-400 mt-4">
        ESPAÑOLA Academy © {survey.year}
      </p>
    </div>
  );
}

// ===== Score Input Component =====
function ScoreInput({
  label, max, value, onChange,
}: {
  label: string; max: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 1))}
            className="px-2.5 py-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors text-lg leading-none"
          >
            −
          </button>
          <span className="w-8 text-center font-bold text-[#1a3a5c]">{value}</span>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="px-2.5 py-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors text-lg leading-none"
          >
            +
          </button>
        </div>
        <span className="text-xs text-zinc-400 w-8 text-left">/{max}</span>
      </div>
    </div>
  );
}
