"use client";

import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateStudentAgeGroup } from "@/lib/actions/students";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";

type AgeGroup = "5-10" | "10-15" | "15+";

const ageGroupLabels: Record<AgeGroup, string> = {
  "5-10": "تحت ١٠ سنوات",
  "10-15": "١٠-١٥ سنة",
  "15+": "فوق ١٥ سنة",
};

interface AgeGroupSelectorProps {
  studentId: string;
  currentAgeGroup: AgeGroup | null;
}

export function AgeGroupSelector({ studentId, currentAgeGroup }: AgeGroupSelectorProps) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(currentAgeGroup);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleAgeGroupChange = (newAgeGroup: AgeGroup) => {
    if (newAgeGroup === ageGroup) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await updateStudentAgeGroup(studentId, newAgeGroup);
      if (result.success) {
        setAgeGroup(newAgeGroup);
        toast.success("تم تحديث الفئة العمرية");
      } else {
        toast.error(result.error || "فشل في تحديث الفئة العمرية");
      }
      setIsOpen(false);
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button 
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors border-b border-dashed border-zinc-300 hover:border-zinc-500 pb-0.5"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          {ageGroup ? ageGroupLabels[ageGroup] : "اختر الفئة العمرية"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(Object.keys(ageGroupLabels) as AgeGroup[]).map((group) => (
          <DropdownMenuItem
            key={group}
            onClick={() => handleAgeGroupChange(group)}
            className="cursor-pointer"
          >
            {ageGroupLabels[group]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
