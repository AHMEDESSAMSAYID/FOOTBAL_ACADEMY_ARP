import { getActivityStats } from "@/lib/actions/activity-logs";
import { getAllUsers } from "@/lib/actions/users";
import { getCurrentUserRole } from "@/lib/auth";
import { SettingsContent } from "./_components/settings-content";

export default async function SettingsPage() {
  const [statsResult, usersResult, { role }] = await Promise.all([
    getActivityStats(),
    getAllUsers(),
    getCurrentUserRole(),
  ]);

  return (
    <SettingsContent 
      stats={statsResult.success ? statsResult.stats! : { today: 0, thisWeek: 0, thisMonth: 0 }}
      recentLogs={statsResult.success ? statsResult.recentLogs! : []}
      coaches={
        usersResult.success && usersResult.users
          ? usersResult.users
              .filter((u) => u.role === "coach")
              .map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                isActive: u.isActive,
                createdAt: u.createdAt,
              }))
          : []
      }
      userRole={role}
    />
  );
}
