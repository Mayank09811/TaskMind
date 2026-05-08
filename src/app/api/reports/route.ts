import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DailyPlan from "@/lib/models/DailyPlan";
import Employee from "@/lib/models/Employee";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    const filter: any = {};
    if (date) filter.date = date;
    if (employeeId) filter.employee = employeeId;

    // Default: get last 7 days if no date specified
    if (!date && !employeeId) {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const plans = await DailyPlan.find(filter)
      .populate('employee', 'name email role')
      .sort({ date: -1 });

    // Compute stats
    const stats = {
      totalPlans: plans.length,
      totalPointers: 0,
      completedPointers: 0,
      blockedPointers: 0,
      delayedPointers: 0,
      avgProductivityPercent: 0,
    };

    for (const plan of plans) {
      stats.totalPointers += plan.pointers.length;
      stats.completedPointers += plan.pointers.filter(p => p.status === 'done').length;
      stats.blockedPointers += plan.pointers.filter(p => p.status === 'blocked').length;
      stats.delayedPointers += plan.pointers.filter(p => p.status === 'delayed').length;
    }

    if (stats.totalPointers > 0) {
      stats.avgProductivityPercent = Math.round(
        (stats.completedPointers / stats.totalPointers) * 100
      );
    }

    return NextResponse.json({ plans, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
