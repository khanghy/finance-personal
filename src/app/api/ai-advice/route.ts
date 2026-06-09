import { NextResponse } from "next/server";
import { RuleBasedAdvisorProvider, sanitizeAdviceInput } from "@/lib/ai-advisor";
import { buildAvalanchePlan, buildSnowballPlan, calculateCashflow } from "@/lib/finance";
import { getFinanceData } from "@/lib/data";

export async function POST() {
  const data = await getFinanceData();
  const summary = calculateCashflow(data.transactions, data.debts);
  const provider = new RuleBasedAdvisorProvider();
  const input = sanitizeAdviceInput({
    monthlyIncome: summary.income,
    monthlyExpense: summary.expense,
    netCashflow: summary.net,
    debts: data.debts,
    overdueDebts: data.debts.filter((debt) => debt.status === "overdue"),
    upcomingDueDebts: data.debts.filter((debt) => debt.status === "due_soon"),
    avalanchePlan: buildAvalanchePlan(data.debts),
    snowballPlan: buildSnowballPlan(data.debts),
    recentTransactions: data.transactions,
  });
  const result = await provider.generateAdvice(input);

  return NextResponse.json({ mode: data.mode, provider: process.env.AI_PROVIDER ?? "rule-based", result });
}
