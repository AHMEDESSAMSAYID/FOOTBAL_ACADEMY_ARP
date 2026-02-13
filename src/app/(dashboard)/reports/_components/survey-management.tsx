"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Link2,
  Copy,
  Check,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
} from "lucide-react";
import {
  createMonthlySurvey,
  getSurveyResults,
} from "@/lib/actions/parent-surveys";

const MONTHS = [
  { value: 1, label: "يناير" }, { value: 2, label: "فبراير" }, { value: 3, label: "مارس" },
  { value: 4, label: "أبريل" }, { value: 5, label: "مايو" }, { value: 6, label: "يونيو" },
  { value: 7, label: "يوليو" }, { value: 8, label: "أغسطس" }, { value: 9, label: "سبتمبر" },
  { value: 10, label: "أكتوبر" }, { value: 11, label: "نوفمبر" }, { value: 12, label: "ديسمبر" },
];

interface SurveyResult {
  studentId: string;
  studentName: string;
  ageGroup: string | null;
  disciplineTotal: number | null;
  moralsTotal: number | null;
  homeTotal: number | null;
  grandTotal: number | null;
  prayer: number | null;
  sleep: number | null;
  healthyEating: number | null;
  respectOthers: number | null;
  angerControl: number | null;
  prepareBag: number | null;
  organizePersonal: number | null;
  fulfillRequests: number | null;
  parentNotes: string | null;
  submittedAt: Date | null;
}

interface ResultsData {
  surveyToken: string;
  totalActive: number;
  submittedCount: number;
  averages: { discipline: number; morals: number; home: number; total: number };
  results: SurveyResult[];
}

export function SurveyManagement() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isPending, startTransition] = useTransition();
  const [surveyToken, setSurveyToken] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"link" | "results">("link");
  const [error, setError] = useState<string | null>(null);

  function handleCreateLink() {
    setError(null);
    startTransition(async () => {
      const result = await createMonthlySurvey(selectedMonth, selectedYear);
      if (result.success && result.survey) {
        setSurveyToken(result.survey.token);
        setAlreadyExists(result.alreadyExists ?? false);
      } else {
        setError(result.error || "فشل في الإنشاء");
      }
    });
  }

  function handleViewResults() {
    setError(null);
    startTransition(async () => {
      const result = await getSurveyResults(selectedMonth, selectedYear);
      if (result.success) {
        if (result.data) {
          setResults(result.data);
          setSurveyToken(result.data.surveyToken);
        } else {
          setResults(null);
          setError("لا يوجد تقييم لهذا الشهر بعد");
        }
        setActiveTab("results");
      } else {
        setError(result.error || "فشل في التحميل");
      }
    });
  }

  function getSurveyUrl(token: string) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/survey/${token}`;
    }
    return `/survey/${token}`;
  }

  async function copyLink() {
    if (!surveyToken) return;
    const url = getSurveyUrl(surveyToken);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    if (!surveyToken) return;
    const url = getSurveyUrl(surveyToken);
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || "";
    const text = `📋 مرحباً أولياء الأمور\nيرجى تعبئة تقييم شهر ${monthLabel} ${selectedYear} لأبنائكم:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const pendingCount = results ? results.totalActive - results.submittedCount : 0;

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            تقييم أولياء الأمور الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-sm text-zinc-500 block mb-1">الشهر</label>
              <select
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={selectedMonth}
                onChange={e => { setSelectedMonth(Number(e.target.value)); setSurveyToken(null); setResults(null); }}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-500 block mb-1">السنة</label>
              <select
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={selectedYear}
                onChange={e => { setSelectedYear(Number(e.target.value)); setSurveyToken(null); setResults(null); }}
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleCreateLink} disabled={isPending} size="sm">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <Link2 className="h-4 w-4 ms-2" />}
              إنشاء الرابط
            </Button>
            <Button onClick={handleViewResults} disabled={isPending} variant="outline" size="sm">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <FileText className="h-4 w-4 ms-2" />}
              عرض النتائج
            </Button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Tab Toggle */}
      {(surveyToken || results) && (
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("link")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "link" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            الرابط
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "results" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            النتائج
          </button>
        </div>
      )}

      {/* Link Tab — single shared link */}
      {activeTab === "link" && surveyToken && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              رابط تقييم شهر {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alreadyExists && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ℹ️ هذا الرابط موجود مسبقاً لهذا الشهر
              </p>
            )}

            <div className="flex items-center gap-2 bg-zinc-50 rounded-lg p-3 border">
              <code className="text-sm flex-1 break-all text-zinc-700 select-all" dir="ltr">
                {getSurveyUrl(surveyToken)}
              </code>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 ms-1 text-emerald-500" /> : <Copy className="h-4 w-4 ms-1" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </Button>
              <Button variant="outline" size="sm" onClick={shareWhatsApp} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <Send className="h-4 w-4 ms-1" />
                إرسال عبر واتساب
              </Button>
            </div>

            <p className="text-xs text-zinc-400">
              أرسل هذا الرابط الواحد لجميع أولياء الأمور — كل واحد يختار ابنه ويعبئ التقييم
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results Tab */}
      {activeTab === "results" && results && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-2xl font-bold text-blue-600">{results.totalActive}</p>
                <p className="text-xs text-zinc-500">إجمالي اللاعبين</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-2xl font-bold text-emerald-600">{results.submittedCount}</p>
                <p className="text-xs text-zinc-500">مُرسل</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-zinc-500">بانتظار</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-2xl font-bold text-purple-600">{results.averages.total} / 50</p>
                <p className="text-xs text-zinc-500">متوسط الدرجات</p>
              </CardContent>
            </Card>
          </div>

          {/* Averages Breakdown */}
          {results.submittedCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">متوسطات التقييم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-700">{results.averages.discipline} / 20</p>
                    <p className="text-xs text-zinc-500">الانضباط</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-700">{results.averages.morals} / 20</p>
                    <p className="text-xs text-zinc-500">الأخلاق</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-700">{results.averages.home} / 10</p>
                    <p className="text-xs text-zinc-500">المساهمة المنزلية</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Results */}
          {results.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">نتائج اللاعبين ({results.results.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {results.results.map(r => (
                    <div key={r.studentId} className="py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedStudent(expandedStudent === r.studentId ? null : r.studentId)}
                        className="w-full flex items-center justify-between text-right"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{r.studentName}</span>
                          {r.ageGroup && <Badge variant="secondary" className="text-xs">{r.ageGroup}</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${(r.grandTotal || 0) >= 40 ? "text-emerald-600" : (r.grandTotal || 0) >= 25 ? "text-amber-600" : "text-red-600"}`}>
                            {r.grandTotal} / 50
                          </span>
                          {expandedStudent === r.studentId
                            ? <ChevronUp className="h-4 w-4 text-zinc-400" />
                            : <ChevronDown className="h-4 w-4 text-zinc-400" />
                          }
                        </div>
                      </button>
                      {expandedStudent === r.studentId && (
                        <div className="mt-3 bg-zinc-50 rounded-lg p-3 text-sm space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-zinc-500 text-xs mb-1">⚙️ الانضباط ({r.disciplineTotal}/20)</p>
                              <p className="text-xs">الصلاة: {r.prayer}/10</p>
                              <p className="text-xs">النوم: {r.sleep}/5</p>
                              <p className="text-xs">الأكل: {r.healthyEating}/5</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-xs mb-1">🌟 الأخلاق ({r.moralsTotal}/20)</p>
                              <p className="text-xs">الاحترام: {r.respectOthers}/10</p>
                              <p className="text-xs">التحكم: {r.angerControl}/10</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-xs mb-1">🏠 المنزل ({r.homeTotal}/10)</p>
                              <p className="text-xs">الشنطة: {r.prepareBag}/2</p>
                              <p className="text-xs">الترتيب: {r.organizePersonal}/3</p>
                              <p className="text-xs">الطلبات: {r.fulfillRequests}/5</p>
                            </div>
                          </div>
                          {r.parentNotes && (
                            <div className="pt-2 border-t border-zinc-200">
                              <p className="text-zinc-500 text-xs mb-0.5">ملاحظات:</p>
                              <p className="text-xs">{r.parentNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {results.results.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-zinc-400">
                لم يتم إرسال أي تقييم بعد لهذا الشهر
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
