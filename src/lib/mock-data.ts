import type { Debt, Transaction } from "./types";

export const transactions: Transaction[] = [
  { id: "t1", type: "income", amount: 38_000_000, date: "2026-06-01", category: "Lương", account: "Tài khoản chính", note: "Lương tháng 6" },
  { id: "t2", type: "income", amount: 7_500_000, date: "2026-06-04", category: "Freelance", account: "Tài khoản chính" },
  { id: "t3", type: "expense", amount: 10_500_000, date: "2026-06-02", category: "Nhà ở", account: "Tài khoản chính" },
  { id: "t4", type: "expense", amount: 5_800_000, date: "2026-06-05", category: "Ăn uống", account: "Tiền mặt" },
  { id: "t5", type: "expense", amount: 3_200_000, date: "2026-06-06", category: "Di chuyển", account: "Thẻ debit" },
  { id: "t6", type: "expense", amount: 4_600_000, date: "2026-06-07", category: "Gia đình", account: "Tài khoản chính" },
  { id: "t7", type: "income", amount: 35_000_000, date: "2026-05-01", category: "Lương", account: "Tài khoản chính" },
  { id: "t8", type: "expense", amount: 27_000_000, date: "2026-05-15", category: "Tổng chi", account: "Tài khoản chính" },
];

export const debts: Debt[] = [
  {
    id: "d1",
    name: "Thẻ tín dụng",
    principalAmount: 42_000_000,
    currentBalance: 31_500_000,
    interestRate: 28,
    dueDate: "2026-06-12",
    minimumPayment: 3_000_000,
    status: "due_soon",
  },
  {
    id: "d2",
    name: "Vay tiêu dùng",
    principalAmount: 120_000_000,
    currentBalance: 82_000_000,
    interestRate: 17.5,
    dueDate: "2026-06-20",
    minimumPayment: 6_200_000,
    status: "active",
  },
  {
    id: "d3",
    name: "Trả góp laptop",
    principalAmount: 24_000_000,
    currentBalance: 8_000_000,
    interestRate: 0,
    dueDate: "2026-06-08",
    minimumPayment: 2_000_000,
    status: "overdue",
  },
];
