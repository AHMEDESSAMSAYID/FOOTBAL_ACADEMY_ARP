"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateStudentStatus } from "@/lib/actions/students";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";

type StudentStatus = "active" | "inactive" | "frozen" | "trial";

const statusConfig: Record<StudentStatus, { label: string; className: string }> = {
  active: { label: "نشط", className: "bg-green-100 text-green-700 hover:bg-green-200" },
  inactive: { label: "متوقف", className: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" },
  frozen: { label: "مجمد", className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  trial: { label: "تجريبي", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
};

interface StatusSelectorProps {
  studentId: string;
  currentStatus: StudentStatus;
}

export function StatusSelector({ studentId, currentStatus }: StatusSelectorProps) {
  const [status, setStatus] = useState<StudentStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (newStatus: StudentStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await updateStudentStatus(studentId, newStatus);
      if (result.success) {
        setStatus(newStatus);
        toast.success("تم تحديث الحالة");
      } else {
        toast.error(result.error || "فشل في تحديث الحالة");
      }
      setIsOpen(false);
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button 
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${statusConfig[status].className}`}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          {statusConfig[status].label}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(Object.keys(statusConfig) as StudentStatus[]).map((statusKey) => (
          <DropdownMenuItem
            key={statusKey}
            onClick={() => handleStatusChange(statusKey)}
            className="cursor-pointer"
          >
            <Badge className={statusConfig[statusKey].className}>
              {statusConfig[statusKey].label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
