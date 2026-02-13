import { NextRequest, NextResponse } from "next/server";
import { runEscalationCheck } from "@/lib/actions/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Protect with CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runEscalationCheck();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("Escalation cron error:", error);
    return NextResponse.json(
      { success: false, error: "Escalation check failed" },
      { status: 500 }
    );
  }
}
