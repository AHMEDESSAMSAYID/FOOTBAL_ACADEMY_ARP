import { getSessions } from "@/lib/actions/attendance";
import { AttendanceContent } from "./_components/attendance-content";

export default async function AttendancePage() {
  const { sessions } = await getSessions();

  return <AttendanceContent sessions={sessions ?? []} />;
}
