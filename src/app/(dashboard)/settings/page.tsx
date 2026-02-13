import { getActivityStats } from "@/lib/actions/activity-logs";
import { SettingsContent } from "./_components/settings-content";

export default async function SettingsPage() {
  const statsResult = await getActivityStats();

  return (
    <SettingsContent 
      stats={statsResult.success ? statsResult.stats! : { today: 0, thisWeek: 0, thisMonth: 0 }}
      recentLogs={statsResult.success ? statsResult.recentLogs! : []}
    />
  );
}
