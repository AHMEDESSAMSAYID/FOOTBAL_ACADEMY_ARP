"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Search, Link2, Unlink, Loader2, UserPlus, Sparkles } from "lucide-react";
import NextLink from "next/link";
import {
  getSiblings,
  searchStudents,
  linkSiblings,
  unlinkSibling,
  detectSiblingsByPhone,
} from "@/lib/actions/siblings";

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "متوقف",
  frozen: "مجمد",
  trial: "تجريبي",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-zinc-100 text-zinc-600",
  frozen: "bg-blue-100 text-blue-700",
  trial: "bg-amber-100 text-amber-700",
};

interface Sibling {
  id: string;
  name: string;
  membershipNumber: string | null;
  status: string;
  ageGroup: string | null;
}

interface SearchResult {
  id: string;
  name: string;
  fullName?: string | null;
  membershipNumber: string | null;
  siblingGroupId: string | null;
  status: string;
}

export function SiblingsPanel({ studentId }: { studentId: string }) {
  const [siblings, setSiblings] = useState<Sibling[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [potentialSiblings, setPotentialSiblings] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadSiblings();
  }, [studentId]);

  async function loadSiblings() {
    setLoading(true);
    const result = await getSiblings(studentId);
    if (result.success) {
      setSiblings(result.siblings);
    }
    setLoading(false);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const result = await searchStudents(query, studentId);
    if (result.success) {
      // Filter out already-linked siblings
      const siblingIds = new Set(siblings.map((s) => s.id));
      setSearchResults(result.students.filter((s) => !siblingIds.has(s.id)));
    }
    setSearching(false);
  }

  async function handleLink(targetId: string) {
    startTransition(async () => {
      const result = await linkSiblings(studentId, targetId);
      if (result.success) {
        toast.success("تم ربط الأخوة بنجاح");
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
        setShowSuggestions(false);
        setPotentialSiblings([]);
        await loadSiblings();
      } else {
        toast.error(result.error || "فشل في الربط");
      }
    });
  }

  async function handleUnlink(targetId: string) {
    if (!confirm("هل أنت متأكد من فك ربط هذا الأخ؟")) return;

    startTransition(async () => {
      const result = await unlinkSibling(targetId);
      if (result.success) {
        toast.success("تم فك الربط بنجاح");
        await loadSiblings();
      } else {
        toast.error(result.error || "فشل في فك الربط");
      }
    });
  }

  async function handleAutoDetect() {
    setSearching(true);
    const result = await detectSiblingsByPhone(studentId);
    if (result.success && result.potentialSiblings.length > 0) {
      const siblingIds = new Set(siblings.map((s) => s.id));
      const filtered = result.potentialSiblings
        .filter((s) => !siblingIds.has(s.id))
        .map((s) => ({ ...s, fullName: null as string | null }));
      if (filtered.length > 0) {
        setPotentialSiblings(filtered);
        setShowSuggestions(true);
      } else {
        toast.info("جميع الأخوة المحتملين مرتبطون بالفعل");
      }
    } else {
      toast.info("لم يتم العثور على أخوة محتملين بناءً على أرقام الهواتف");
    }
    setSearching(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-zinc-100 rounded-lg" />
        <div className="h-16 bg-zinc-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Linked siblings */}
      {siblings.length > 0 ? (
        <div className="space-y-2">
          {siblings.map((sibling) => (
            <div
              key={sibling.id}
              className="flex items-center justify-between p-3 rounded-xl border border-violet-200 bg-violet-50"
            >
              <NextLink
                href={`/students/${sibling.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-200 text-violet-700 text-sm font-bold">
                  {sibling.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-zinc-800">{sibling.name}</p>
                  <p className="text-xs text-zinc-500">
                    {sibling.membershipNumber || "بدون رقم"}
                    {sibling.ageGroup && ` • ${sibling.ageGroup}`}
                  </p>
                </div>
              </NextLink>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sibling.status] || "bg-zinc-100"}`}>
                  {statusLabels[sibling.status] || sibling.status}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleUnlink(sibling.id)}
                  disabled={isPending}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-zinc-400 text-sm">
          لا يوجد أخوة مرتبطين
        </div>
      )}

      {/* Auto-detect suggestions */}
      {showSuggestions && potentialSiblings.length > 0 && (
        <div className="space-y-2 p-3 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            أخوة محتملين (نفس رقم الهاتف)
          </p>
          {potentialSiblings.map((ps) => (
            <div key={ps.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-100">
              <div>
                <p className="text-sm font-medium">{ps.name}</p>
                <p className="text-xs text-zinc-500">{ps.membershipNumber}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => handleLink(ps.id)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3 ml-1" />}
                ربط
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Search panel */}
      {showSearch && (
        <div className="space-y-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="ابحث باسم اللاعب..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-9 bg-white"
              autoFocus
            />
          </div>
          {searching && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border hover:border-violet-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{result.name}</p>
                    <p className="text-xs text-zinc-500">
                      {result.membershipNumber}
                      {result.siblingGroupId && " • لديه أخوة مرتبطين"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-violet-300 text-violet-700 hover:bg-violet-100"
                    onClick={() => handleLink(result.id)}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3 ml-1" />}
                    ربط كأخ
                  </Button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-2">لا نتائج</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => { setShowSearch(!showSearch); setShowSuggestions(false); }}
        >
          <UserPlus className="h-3.5 w-3.5 ml-1" />
          {showSearch ? "إغلاق البحث" : "إضافة أخ"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={handleAutoDetect}
          disabled={searching}
        >
          {searching ? (
            <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 ml-1" />
          )}
          كشف تلقائي
        </Button>
      </div>
    </div>
  );
}
