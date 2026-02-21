"use client";

import { useState, useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Search, X, Filter, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { updateRegistrationFormStatus } from "@/lib/actions/students";

interface Student {
  id: string;
  name: string;
  membershipNumber: string | null;
  status: string;
  ageGroup: string | null;
  phone: string | null;
  area: string | null;
  birthDate: string | null;
  registrationDate: string;
  registrationFormStatus: string | null;
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  return years;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "نشط", className: "bg-green-100 text-green-700" },
  inactive: { label: "متوقف", className: "bg-zinc-100 text-zinc-700" },
  frozen: { label: "مجمد", className: "bg-blue-100 text-blue-700" },
  trial: { label: "تجريبي", className: "bg-amber-100 text-amber-700" },
};

const ageGroupLabels: Record<string, string> = {
  "5-10": "تحت ١٠",
  "10-15": "١٠-١٥",
  "15+": "فوق ١٥",
};

const formStatusLabels: Record<string, { label: string; className: string }> = {
  filled: { label: "مكتمل", className: "bg-green-100 text-green-700" },
  not_filled: { label: "غير مكتمل", className: "bg-red-100 text-red-700" },
};

type SortColumn = "name" | "membershipNumber" | "age" | "ageGroup" | "area" | "registrationDate" | "status" | "formStatus";
type SortDirection = "asc" | "desc";

function SortableHeader({ 
  label, column, sortColumn, sortDirection, onSort, className 
}: { 
  label: string; column: SortColumn; sortColumn: SortColumn; sortDirection: SortDirection; onSort: (col: SortColumn) => void; className?: string;
}) {
  const isActive = sortColumn === column;
  return (
    <TableHead 
      className={`text-right cursor-pointer select-none hover:bg-zinc-100 transition-colors ${className || ""}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-zinc-700" /> : <ArrowDown className="h-3.5 w-3.5 text-zinc-700" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-zinc-300" />
        )}
      </span>
    </TableHead>
  );
}

interface StudentsTableProps {
  students: Student[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [formStatusFilter, setFormStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // Extract unique areas from data
  const areas = useMemo(() => {
    const areaSet = new Set<string>();
    students.forEach((s) => {
      if (s.area) areaSet.add(s.area);
    });
    return Array.from(areaSet).sort();
  }, [students]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    ageGroupFilter !== "all" ||
    areaFilter !== "all" ||
    formStatusFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setAgeGroupFilter("all");
    setAreaFilter("all");
    setFormStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setSortColumn("name");
    setSortDirection("asc");
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
      const matchesSearch =
        search === "" ||
        student.name.includes(search) ||
        (student.membershipNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (student.phone || "").includes(search);
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const matchesAgeGroup =
        ageGroupFilter === "all" || student.ageGroup === ageGroupFilter;
      const matchesArea =
        areaFilter === "all" || student.area === areaFilter;
      const matchesFormStatus =
        formStatusFilter === "all" || (student.registrationFormStatus || "not_filled") === formStatusFilter;
      const matchesDateFrom =
        !dateFrom || student.registrationDate >= dateFrom;
      const matchesDateTo =
        !dateTo || student.registrationDate <= dateTo;

      return matchesSearch && matchesStatus && matchesAgeGroup && matchesArea && matchesFormStatus && matchesDateFrom && matchesDateTo;
    });

    // Sort
    const dir = sortDirection === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (sortColumn) {
        case "name":
          return dir * a.name.localeCompare(b.name, "ar");
        case "membershipNumber":
          return dir * (a.membershipNumber || "").localeCompare(b.membershipNumber || "");
        case "age": {
          const ageA = calculateAge(a.birthDate) ?? 999;
          const ageB = calculateAge(b.birthDate) ?? 999;
          return dir * (ageA - ageB);
        }
        case "ageGroup":
          return dir * (a.ageGroup || "").localeCompare(b.ageGroup || "");
        case "area":
          return dir * (a.area || "").localeCompare(b.area || "", "ar");
        case "registrationDate":
          return dir * a.registrationDate.localeCompare(b.registrationDate);
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "formStatus":
          return dir * (a.registrationFormStatus || "not_filled").localeCompare(b.registrationFormStatus || "not_filled");
        default:
          return 0;
      }
    });

    return result;
  }, [students, search, statusFilter, ageGroupFilter, areaFilter, formStatusFilter, dateFrom, dateTo, sortColumn, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="بحث بالاسم، رقم العضوية، أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            فلترة
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-white/20 text-xs px-1.5 py-0">
                !
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-red-500 hover:text-red-600">
              <X className="h-4 w-4" />
              مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="trial">تجريبي</SelectItem>
                  <SelectItem value="frozen">مجمد</SelectItem>
                  <SelectItem value="inactive">متوقف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">الفئة العمرية</label>
              <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="الفئة العمرية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="5-10">تحت ١٠</SelectItem>
                  <SelectItem value="10-15">١٠-١٥</SelectItem>
                  <SelectItem value="15+">فوق ١٥</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">المنطقة</label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="المنطقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المناطق</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Registration Form Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">استمارة التسجيل</label>
              <Select value={formStatusFilter} onValueChange={setFormStatusFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="استمارة التسجيل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="filled">مكتمل</SelectItem>
                  <SelectItem value="not_filled">غير مكتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              تاريخ التسجيل
            </label>
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-white w-full sm:w-44"
                dir="ltr"
              />
              <span className="text-sm text-zinc-400">إلى</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-white w-full sm:w-44"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <SortableHeader label="اللاعب" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="رقم العضوية" column="membershipNumber" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="العمر" column="age" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="الفئة العمرية" column="ageGroup" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="المنطقة" column="area" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="hidden md:table-cell" />
              <SortableHeader label="تاريخ التسجيل" column="registrationDate" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="hidden md:table-cell" />
              <SortableHeader label="الحالة" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="الاستمارة" column="formStatus" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="hidden md:table-cell" />
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                  {students.length === 0
                    ? "لا يوجد لاعبين مسجلين بعد. قم بتسجيل أول لاعب!"
                    : "لا يوجد لاعبين مطابقين للبحث"}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const age = calculateAge(student.birthDate);
                const formSt = student.registrationFormStatus || "not_filled";
                return (
                <TableRow key={student.id} className="hover:bg-zinc-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {student.membershipNumber || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">{age != null ? String(age) : "-"}</TableCell>
                  <TableCell>{student.ageGroup ? ageGroupLabels[student.ageGroup] || student.ageGroup : "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-zinc-600">
                    {student.area || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-zinc-600" dir="ltr">
                    {student.registrationDate || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusLabels[student.status]?.className || "bg-zinc-100 text-zinc-700"}>
                      {statusLabels[student.status]?.label || student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <button
                      onClick={() => {
                        const newStatus = formSt === "filled" ? "not_filled" : "filled";
                        setTogglingId(student.id);
                        startTransition(async () => {
                          await updateRegistrationFormStatus(student.id, newStatus);
                          setTogglingId(null);
                        });
                      }}
                      disabled={togglingId === student.id}
                      className="cursor-pointer hover:opacity-70 transition-opacity"
                    >
                      {togglingId === student.id ? (
                        <Badge className="bg-zinc-100 text-zinc-500"><Loader2 className="h-3 w-3 animate-spin" /></Badge>
                      ) : (
                        <Badge className={formStatusLabels[formSt]?.className || "bg-zinc-100 text-zinc-700"}>
                          {formStatusLabels[formSt]?.label || formSt}
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/students/${student.id}`}>عرض</Link>
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <p className="text-sm text-zinc-500">
        عرض {filteredStudents.length} من {students.length} لاعب
      </p>
    </div>
  );
}
