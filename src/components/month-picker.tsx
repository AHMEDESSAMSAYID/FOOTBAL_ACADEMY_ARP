"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Calendar, Check } from "lucide-react";

interface MonthPickerProps {
  /** Currently selected yearMonth (YYYY-MM) */
  currentMonth: string;
}

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل",
  "مايو", "يونيو", "يوليو", "أغسطس",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthPicker({ currentMonth }: MonthPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = getCurrentYearMonth();
  const isCurrentMonth = currentMonth === current;

  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => {
    return parseInt(currentMonth.split("-")[0]);
  });
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function navigate(ym: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (ym === current) {
      params.delete("month");
    } else {
      params.set("month", ym);
    }
    const q = params.toString();
    router.push(q ? `?${q}` : "?");
    setOpen(false);
  }

  const selectedMonth = parseInt(currentMonth.split("-")[1]);
  const selectedYear = parseInt(currentMonth.split("-")[0]);
  const currentYearNum = parseInt(current.split("-")[0]);
  const currentMonthNum = parseInt(current.split("-")[1]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <Button
        variant="outline"
        className="flex items-center gap-2 px-4 h-10"
        onClick={() => {
          setPickerYear(selectedYear);
          setOpen(!open);
        }}
      >
        <Calendar className="h-4 w-4 text-zinc-500" />
        <span className="font-medium">{formatMonthLabel(currentMonth)}</span>
        {!isCurrentMonth && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
            فلتر
          </span>
        )}
      </Button>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white border border-zinc-200 rounded-xl shadow-lg p-4 w-[300px]">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPickerYear(pickerYear - 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-bold text-lg">{pickerYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPickerYear(pickerYear + 1)}
              disabled={pickerYear >= currentYearNum}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((name, i) => {
              const monthNum = i + 1;
              const ym = `${pickerYear}-${String(monthNum).padStart(2, "0")}`;
              const isSelected = pickerYear === selectedYear && monthNum === selectedMonth;
              const isCurrent = pickerYear === currentYearNum && monthNum === currentMonthNum;
              const isFuture = pickerYear > currentYearNum || 
                (pickerYear === currentYearNum && monthNum > currentMonthNum);

              return (
                <button
                  key={monthNum}
                  disabled={isFuture}
                  onClick={() => navigate(ym)}
                  className={`
                    relative px-2 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isFuture ? "text-zinc-300 cursor-not-allowed" : "hover:bg-zinc-100 cursor-pointer"}
                    ${isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                    ${isCurrent && !isSelected ? "ring-2 ring-blue-300 ring-inset" : ""}
                  `}
                >
                  {name}
                  {isSelected && (
                    <Check className="h-3 w-3 absolute top-1 left-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          {!isCurrentMonth && (
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-blue-600"
                onClick={() => navigate(current)}
              >
                العودة للشهر الحالي
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
