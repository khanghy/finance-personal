import { describe, expect, it } from "vitest";
import { buildAvalanchePlan, buildSnowballPlan, calculateCashflow, calculateMonthlyCashflow, filterTransactionsByMonth } from "./finance";
import type { Debt, Transaction } from "./types";

const transactions: Transaction[] = [
  { id: "1", type: "income", amount: 10_000_000, date: "2026-06-01", category: "Lương", account: "Bank" },
  { id: "2", type: "expense", amount: 3_000_000, date: "2026-06-02", category: "Ăn uống", account: "Cash" },
  { id: "3", type: "income", amount: 8_000_000, date: "2026-05-01", category: "Lương", account: "Bank" },
  { id: "4", type: "expense", amount: 2_500_000, date: "2026-05-02", category: "Nhà ở", account: "Bank" },
];

const debts: Debt[] = [
  { id: "a", name: "A", principalAmount: 10_000_000, currentBalance: 8_000_000, interestRate: 10, dueDate: "2026-06-20", minimumPayment: 500_000, status: "active" },
  { id: "b", name: "B", principalAmount: 20_000_000, currentBalance: 2_000_000, interestRate: 25, dueDate: "2026-06-12", minimumPayment: 700_000, status: "due_soon" },
];

describe("finance calculations", () => {
  it("calculates cashflow and debt ratio", () => {
    expect(calculateCashflow(transactions, debts)).toEqual({
      income: 18_000_000,
      expense: 5_500_000,
      net: 12_500_000,
      debtTotal: 10_000_000,
      debtToIncomeRatio: 10_000_000 / 18_000_000,
    });
  });

  it("filters transactions by selected month", () => {
    expect(filterTransactionsByMonth(transactions, "2026-06").map((transaction) => transaction.id)).toEqual(["1", "2"]);
    expect(filterTransactionsByMonth(transactions, "2026-05").map((transaction) => transaction.id)).toEqual(["3", "4"]);
  });

  it("calculates monthly cashflow without changing debt totals", () => {
    expect(calculateMonthlyCashflow(transactions, debts, "2026-05")).toEqual({
      income: 8_000_000,
      expense: 2_500_000,
      net: 5_500_000,
      debtTotal: 10_000_000,
      debtToIncomeRatio: 1.25,
    });
    expect(calculateMonthlyCashflow(transactions, debts, "2026-06")).toEqual({
      income: 10_000_000,
      expense: 3_000_000,
      net: 7_000_000,
      debtTotal: 10_000_000,
      debtToIncomeRatio: 1,
    });
  });

  it("prioritizes high interest debt for avalanche", () => {
    expect(buildAvalanchePlan(debts).map((item) => item.debtId)).toEqual(["b", "a"]);
  });

  it("prioritizes low balance debt for snowball", () => {
    expect(buildSnowballPlan(debts).map((item) => item.debtId)).toEqual(["b", "a"]);
  });
});
