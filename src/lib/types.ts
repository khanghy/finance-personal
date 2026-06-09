export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  account: string;
  note?: string;
  isRecurring?: boolean;
};

export type Debt = {
  id: string;
  name: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  dueDate: string;
  minimumPayment: number;
  status: "active" | "due_soon" | "overdue" | "paid";
};

export type DebtPayment = {
  id: string;
  debtId: string;
  amount: number;
  paidAt: string;
  note?: string;
};

export type AppNotification = {
  id: string;
  type: "debt_due_soon" | "debt_overdue" | "negative_cashflow" | "minimum_payment_risk";
  title: string;
  body: string;
  status: "unread" | "read" | "dismissed";
  dueAt?: string;
  relatedDebtId?: string;
};

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type AdviceAction = {
  title: string;
  reason: string;
  impact: string;
  urgency: "low" | "medium" | "high";
};

export type AdviceResult = {
  summary: string;
  riskLevel: RiskLevel;
  actions: AdviceAction[];
  debtRecommendation: "avalanche" | "snowball" | "crisis-first";
  disclaimer: string;
};
