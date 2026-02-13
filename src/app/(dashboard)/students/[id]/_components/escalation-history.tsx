"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getEscalationHistory } from "@/lib/actions/notifications";
import { AlertTriangle, Bell, ShieldAlert, CheckCircle2, Mail, MessageCircle } from "lucide-react";

interface EscalationHistoryProps {
  studentId: string;
}

const levelConfig = {
  reminder: {
    label: "تذكير",
    icon: <Bell className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800",
    bgColor: "bg-blue-50",
  },
  warning: {
    label: "تحذير",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-amber-100 text-amber-800",
    bgColor: "bg-amber-50",
  },
  blocked: {
    label: "حظر",
    icon: <ShieldAlert className="h-4 w-4" />,
    color: "bg-red-100 text-red-800",
    bgColor: "bg-red-50",
  },
};

const channelIcons = {
  email: <Mail className="h-3 w-3" />,
  telegram: <MessageCircle className="h-3 w-3" />,
};

const notifTypeLabels: Record<string, string> = {
  payment_reminder: "تذكير بالدفع",
  payment_received: "تأكيد استلام",
  payment_overdue: "دفعة متأخرة",
  trial_reminder: "تذكير تجربة",
  general: "عام",
};

export function EscalationHistory({ studentId }: EscalationHistoryProps) {
  const [escalations, setEscalations] = useState<Array<{
    id: string;
    level: "reminder" | "warning" | "blocked";
    daysOverdue: number;
    triggeredAt: Date;
    resolvedAt: Date | null;
  }>>([]);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    channel: "email" | "telegram";
    notificationType: string;
    content: string;
    status: string;
    sentAt: Date | null;
    createdAt: Date;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getEscalationHistory(studentId);
      if (result.success) {
        setEscalations(result.escalations as typeof escalations);
        setNotifications(result.notifications as typeof notifications);
      }
      setLoading(false);
    }
    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (escalations.length === 0 && notifications.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p>لا يوجد سجل تصعيد لهذا اللاعب</p>
        <p className="text-xs">هذا يعني أن جميع المدفوعات في وقتها</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Escalation Events */}
      {escalations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-700">أحداث التصعيد</h4>
          {escalations.map((esc) => {
            const config = levelConfig[esc.level];
            return (
              <div key={esc.id} className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor}`}>
                {config.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>{config.label}</Badge>
                    <span className="text-xs text-zinc-500">
                      متأخر {esc.daysOverdue} يوم
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1" suppressHydrationWarning>
                    {new Date(esc.triggeredAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>
                {esc.resolvedAt && (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle2 className="h-3 w-3 ms-1" />
                    تم الحل
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notification History */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-700">سجل الإشعارات</h4>
          {notifications.map((notif) => (
            <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200">
                {channelIcons[notif.channel]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {notifTypeLabels[notif.notificationType] || notif.notificationType}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {notif.channel === "email" ? "بريد" : "تيليجرام"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      notif.status === "sent" ? "text-green-600" :
                      notif.status === "failed" ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {notif.status === "sent" ? "مرسل" : notif.status === "failed" ? "فشل" : "قيد الانتظار"}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{notif.content}</p>
                <p className="text-xs text-zinc-400 mt-1" suppressHydrationWarning>
                  {new Date(notif.createdAt).toLocaleString("ar-EG")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
