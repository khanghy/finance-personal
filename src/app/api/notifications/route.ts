import { NextResponse } from "next/server";
import { calculateCashflow } from "@/lib/finance";
import { getFinanceData } from "@/lib/data";
import { generateCashflowNotification, generateDebtNotifications } from "@/lib/notifications";

export async function GET() {
  const data = await getFinanceData();
  const summary = calculateCashflow(data.transactions, data.debts);
  const generated = [...generateDebtNotifications(data.debts), ...generateCashflowNotification(summary.net)];

  return NextResponse.json({
    mode: data.mode,
    notifications: [...data.notifications, ...generated],
  });
}
