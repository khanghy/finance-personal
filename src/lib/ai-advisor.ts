import { z } from "zod";
import type { AdviceResult, Debt, Transaction } from "./types";
import type { DebtPlanItem } from "./finance";

export type AdviceInput = {
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  debts: Debt[];
  overdueDebts: Debt[];
  upcomingDueDebts: Debt[];
  avalanchePlan: DebtPlanItem[];
  snowballPlan: DebtPlanItem[];
  recentTransactions: Transaction[];
};

export interface AiAdvisorProvider {
  generateAdvice(input: AdviceInput): Promise<AdviceResult>;
}

const adviceResultSchema = z.object({
  summary: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  actions: z.array(
    z.object({
      title: z.string().min(1),
      reason: z.string().min(1),
      impact: z.string().min(1),
      urgency: z.enum(["low", "medium", "high"]),
    }),
  ),
  debtRecommendation: z.enum(["avalanche", "snowball", "crisis-first"]),
  disclaimer: z.string().min(1),
});

export function parseAdviceResult(value: unknown): AdviceResult {
  return adviceResultSchema.parse(value);
}

export function sanitizeAdviceInput(input: AdviceInput): AdviceInput {
  return {
    ...input,
    debts: input.debts.map(({ id, name, principalAmount, currentBalance, interestRate, dueDate, minimumPayment, status }) => ({
      id,
      name,
      principalAmount,
      currentBalance,
      interestRate,
      dueDate,
      minimumPayment,
      status,
    })),
    recentTransactions: input.recentTransactions.slice(0, 20).map((transaction) => ({
      ...transaction,
      note: transaction.note?.slice(0, 160),
    })),
  };
}

export class RuleBasedAdvisorProvider implements AiAdvisorProvider {
  async generateAdvice(input: AdviceInput): Promise<AdviceResult> {
    const sanitized = sanitizeAdviceInput(input);
    const hasOverdueDebt = sanitized.overdueDebts.length > 0;
    const isNegative = sanitized.netCashflow < 0;
    const riskLevel = hasOverdueDebt && isNegative ? "critical" : hasOverdueDebt || isNegative ? "high" : "medium";

    return {
      summary: isNegative
        ? "Dòng tiền đang âm, nên ưu tiên bảo toàn tiền mặt và tránh phát sinh phí phạt."
        : "Dòng tiền vẫn dương, có thể phân bổ phần dư để tăng tốc trả nợ.",
      riskLevel,
      debtRecommendation: hasOverdueDebt || isNegative ? "crisis-first" : "avalanche",
      actions: [
        {
          title: hasOverdueDebt ? "Xử lý khoản quá hạn trước" : "Giữ thanh toán tối thiểu đúng hạn",
          reason: hasOverdueDebt
            ? "Khoản quá hạn thường kéo theo phí phạt và ảnh hưởng điểm tín dụng."
            : "Thanh toán tối thiểu giúp tránh phí phạt trong khi bạn tối ưu phần tiền dư.",
          impact: "Giảm rủi ro phí phạt và áp lực dòng tiền ngắn hạn.",
          urgency: hasOverdueDebt ? "high" : "medium",
        },
        {
          title: "Dùng avalanche cho phần tiền dư",
          reason: "Trả khoản có lãi suất cao trước thường giảm tổng chi phí lãi.",
          impact: "Tối ưu chi phí nợ trong trung hạn.",
          urgency: "medium",
        },
      ],
      disclaimer: "Đây là gợi ý tham khảo từ AI, không thay thế tư vấn tài chính chuyên nghiệp.",
    };
  }
}
