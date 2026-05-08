import { NextResponse } from "next/server";
import timerManager from "@/lib/timerManager";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId');

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const notifications = timerManager.getNotifications(employeeId);

  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  try {
    const { notificationIds } = await req.json();
    timerManager.markAsRead(notificationIds || []);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
