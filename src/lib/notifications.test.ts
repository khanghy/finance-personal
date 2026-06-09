import { describe, expect, it } from "vitest";
import { generateCashflowNotification, generateDebtNotifications } from "./notifications";
import type { Debt } from "./types";

const debts: Debt[] = [
  { id: "1", name: "Thẻ", principalAmount: 10, currentBalance: 10, interestRate: 20, dueDate: "2026-06-10", minimumPayment: 1, status: "due_soon" },
  { id: "2", name: "Vay", principalAmount: 10, currentBalance: 10, interestRate: 10, dueDate: "2026-06-01", minimumPayment: 1, status: "overdue" },
];

describe("notifications", () => {
  it("creates due soon and overdue debt notifications", () => {
    const result = generateDebtNotifications(debts, new Date("2026-06-09T00:00:00"));

    expect(result.map((item) => item.type)).toEqual(["debt_due_soon", "debt_overdue"]);
  });

  it("creates negative cashflow notification", () => {
    expect(generateCashflowNotification(-1)).toHaveLength(1);
    expect(generateCashflowNotification(1)).toHaveLength(0);
  });
});
