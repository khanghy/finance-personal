import { describe, expect, it } from "vitest";
import { parseAdviceResult, RuleBasedAdvisorProvider } from "./ai-advisor";

describe("ai advisor", () => {
  it("parses valid advice output", () => {
    expect(
      parseAdviceResult({
        summary: "Ổn",
        riskLevel: "medium",
        actions: [{ title: "A", reason: "B", impact: "C", urgency: "medium" }],
        debtRecommendation: "avalanche",
        disclaimer: "Tham khảo.",
      }).riskLevel,
    ).toBe("medium");
  });

  it("uses crisis-first when cashflow is negative", async () => {
    const provider = new RuleBasedAdvisorProvider();
    const result = await provider.generateAdvice({
      monthlyIncome: 1,
      monthlyExpense: 2,
      netCashflow: -1,
      debts: [],
      overdueDebts: [],
      upcomingDueDebts: [],
      avalanchePlan: [],
      snowballPlan: [],
      recentTransactions: [],
    });

    expect(result.debtRecommendation).toBe("crisis-first");
  });
});
