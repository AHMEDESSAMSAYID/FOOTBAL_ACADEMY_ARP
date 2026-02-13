"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Contact } from "@/db/schema";
import { deleteContact } from "@/lib/actions/contacts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ContactsListProps {
  contacts: Contact[];
  studentId: string;
}

const relationLabels: Record<string, string> = {
  father: "الأب",
  mother: "الأم",
  guardian: "ولي الأمر",
  other: "آخر",
};

export function ContactsList({ contacts, studentId }: ContactsListProps) {
  const router = useRouter();
  
  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        لم يتم إضافة جهات اتصال بعد
      </div>
    );
  }

  async function handleDelete(contactId: string) {
    if (!confirm("هل أنت متأكد من حذف جهة الاتصال هذه؟")) return;
    
    const result = await deleteContact(contactId);
    if (result.success) {
      toast.success("تم حذف جهة الاتصال");
      router.refresh();
    } else {
      toast.error(result.error || "فشل في الحذف");
    }
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center justify-between p-4 rounded-lg border border-zinc-200"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-lg">
              {contact.relation === "father" && "👨"}
              {contact.relation === "mother" && "👩"}
              {contact.relation === "guardian" && "👤"}
              {contact.relation === "other" && "👤"}
              {!contact.relation && "👤"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{contact.name}</p>
                {contact.isPrimaryPayer && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    المحصل الرسمي
                  </Badge>
                )}
              </div>
              <p className="text-sm text-zinc-500">
                {contact.relation ? relationLabels[contact.relation] : ""}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p dir="ltr" className="font-mono text-sm">{contact.phone}</p>
              {contact.email && (
                <p className="text-xs text-zinc-500">{contact.email}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={`tel:${contact.phone}`}>📞</a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDelete(contact.id)}
                className="text-red-500 hover:text-red-700"
              >
                🗑️
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
