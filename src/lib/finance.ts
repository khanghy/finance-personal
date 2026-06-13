import type { Debt, Transaction } from "./types";

export type CashflowSummary = {
  income: number;
  expense: number;
  net: number;
  debtTotal: number;
  debtToIncomeRatio: number;
};

export type DebtPlanItem = {
  debtId: string;
  name: string;
  rank: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
};

export function calculateCashflow(transactions: Transaction[], debts: Debt[]): CashflowSummary {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const debtTotal = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);

  return {
    income,
    expense,
    net: income - expense,
    debtTotal,
    debtToIncomeRatio: income === 0 ? 0 : debtTotal / income,
  };
}

export function filterTransactionsByMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((transaction) => transaction.date.slice(0, 7) === month);
}

export function calculateMonthlyCashflow(transactions: Transaction[], debts: Debt[], month: string): CashflowSummary {
  return calculateCashflow(filterTransactionsByMonth(transactions, month), debts);
}

export function buildAvalanchePlan(debts: Debt[]): DebtPlanItem[] {
  return debts
    .filter((debt) => debt.currentBalance > 0)
    .sort((a, b) => b.interestRate - a.interestRate || a.currentBalance - b.currentBalance)
    .map(toPlanItem);
}

export function buildSnowballPlan(debts: Debt[]): DebtPlanItem[] {
  return debts
    .filter((debt) => debt.currentBalance > 0)
    .sort((a, b) => a.currentBalance - b.currentBalance || b.interestRate - a.interestRate)
    .map(toPlanItem);
}

export function monthlySeries(transactions: Transaction[]) {
  const months = new Map<string, { month: string; income: number; expense: number }>();

  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7);
    const current = months.get(month) ?? { month, income: 0, expense: 0 };
    current[transaction.type] += transaction.amount;
    months.set(month, current);
  }

  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function categoryExpenseSeries(transactions: Transaction[]) {
  const categories = new Map<string, number>();

  for (const transaction of transactions.filter((item) => item.type === "expense")) {
    categories.set(transaction.category, (categories.get(transaction.category) ?? 0) + transaction.amount);
  }

  return [...categories.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function toPlanItem(debt: Debt, index: number): DebtPlanItem {
  return {
    debtId: debt.id,
    name: debt.name,
    rank: index + 1,
    currentBalance: debt.currentBalance,
    interestRate: debt.interestRate,
    minimumPayment: debt.minimumPayment,
  };
}
