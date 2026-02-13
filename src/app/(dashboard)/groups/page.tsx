import { getGroupsData } from "@/lib/actions/groups";
import { GroupsContent } from "./_components/groups-content";

export default async function GroupsPage() {
  const result = await getGroupsData();

  return (
    <GroupsContent
      groups={result.success ? result.groups! : []}
      error={result.success ? undefined : result.error}
    />
  );
}
