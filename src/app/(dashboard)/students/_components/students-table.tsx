"use client";

import { useState, useMemo } from "react";
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
import { Search, X, Filter, CalendarDays } from "lucide-react";

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
}

function calculateAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  return `${years}`;
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

interface StudentsTableProps {
  students: Student[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFilters, setShowFilters] = useState(false);

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
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setAgeGroupFilter("all");
    setAreaFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setSortBy("name");
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
      const matchesDateFrom =
        !dateFrom || student.registrationDate >= dateFrom;
      const matchesDateTo =
        !dateTo || student.registrationDate <= dateTo;

      return matchesSearch && matchesStatus && matchesAgeGroup && matchesArea && matchesDateFrom && matchesDateTo;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "ar");
        case "date-new":
          return b.registrationDate.localeCompare(a.registrationDate);
        case "date-old":
          return a.registrationDate.localeCompare(b.registrationDate);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return result;
  }, [students, search, statusFilter, ageGroupFilter, areaFilter, dateFrom, dateTo, sortBy]);

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

            {/* Sort */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">الترتيب</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">الاسم (أبجدي)</SelectItem>
                  <SelectItem value="date-new">التسجيل (الأحدث)</SelectItem>
                  <SelectItem value="date-old">التسجيل (الأقدم)</SelectItem>
                  <SelectItem value="status">الحالة</SelectItem>
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
              <TableHead className="text-right">اللاعب</TableHead>
              <TableHead className="text-right">رقم العضوية</TableHead>
              <TableHead className="text-right">العمر</TableHead>
              <TableHead className="text-right">الفئة العمرية</TableHead>
              <TableHead className="text-right hidden md:table-cell">المنطقة</TableHead>
              <TableHead className="text-right hidden md:table-cell">تاريخ التسجيل</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                  {students.length === 0
                    ? "لا يوجد لاعبين مسجلين بعد. قم بتسجيل أول لاعب!"
                    : "لا يوجد لاعبين مطابقين للبحث"}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
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
                  <TableCell className="text-sm text-zinc-600">{calculateAge(student.birthDate) || "-"}</TableCell>
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
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/students/${student.id}`}>عرض</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
