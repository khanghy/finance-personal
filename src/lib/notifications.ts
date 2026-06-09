import { daysBetween } from "./utils";
import type { AppNotification, Debt } from "./types";

export function generateDebtNotifications(
  debts: Debt[],
  today = new Date(),
  dueSoonWindowDays = 7,
): AppNotification[] {
  return debts.flatMap<AppNotification>((debt) => {
    if (debt.currentBalance <= 0) {
      return [];
    }

    const dueDate = new Date(`${debt.dueDate}T00:00:00`);
    const daysToDue = daysBetween(today, dueDate);

    if (daysToDue < 0) {
      return [
        {
          id: `overdue-${debt.id}`,
          type: "debt_overdue",
          title: `${debt.name} đã quá hạn`,
          body: `Khoản nợ đã quá hạn ${Math.abs(daysToDue)} ngày. Ưu tiên xử lý khoản tối thiểu để giảm phí phạt.`,
          status: "unread",
          dueAt: debt.dueDate,
          relatedDebtId: debt.id,
        },
      ];
    }

    if (daysToDue <= dueSoonWindowDays) {
      return [
        {
          id: `due-soon-${debt.id}`,
          type: "debt_due_soon",
          title: `${debt.name} sắp đến hạn`,
          body: `Còn ${daysToDue} ngày đến hạn. Khoản tối thiểu cần chuẩn bị là ${debt.minimumPayment.toLocaleString("vi-VN")} VND.`,
          status: "unread",
          dueAt: debt.dueDate,
          relatedDebtId: debt.id,
        },
      ];
    }

    return [];
  });
}

export function generateCashflowNotification(netCashflow: number): AppNotification[] {
  if (netCashflow >= 0) {
    return [];
  }

  return [
    {
      id: "negative-cashflow-current-period",
      type: "negative_cashflow",
      title: "Dòng tiền đang âm",
      body: "Chi tiêu đang vượt thu nhập trong kỳ này. Hãy tạm dừng khoản chi không thiết yếu trước khi tăng trả nợ.",
      status: "unread",
    },
  ];
}
