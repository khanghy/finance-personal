import { describe, expect, it } from "vitest";
import { normalizeTransactionRow } from "./normalize";

const referenceDate = new Date("2026-06-13T00:00:00Z");

describe("transaction normalizer", () => {
  it.each([
    ["120k", 120_000],
    ["120.000", 120_000],
    ["120,000", 120_000],
    ["1tr2", 1_200_000],
  ])("normalizes amount format %s", (amount, expected) => {
    const result = normalizeTransactionRow(
      { amount, date: "2026-06-13", category: " Ăn uống ", account: " Tiền mặt " },
      { referenceDate },
    );

    expect(result.transaction?.amount).toBe(expected);
    expect(result.transaction?.type).toBe("income");
    expect(result.issues).toEqual([]);
  });

  it.each([
    ["2026-06-13", "2026-06-13"],
    ["13/06/2026", "2026-06-13"],
    ["13-06-2026", "2026-06-13"],
    ["13/6", "2026-06-13"],
    ["3/6", "2026-06-03"],
  ])("normalizes date format %s", (date, expected) => {
    const result = normalizeTransactionRow(
      { amount: "120000", date, type: "expense", category: "Ăn uống", account: "Tiền mặt" },
      { referenceDate },
    );

    expect(result.transaction?.date).toBe(expected);
  });

  it("infers expense from negative amount and trims text fields", () => {
    const result = normalizeTransactionRow(
      {
        amount: "-120,000",
        date: "13/6",
        type: "income",
        category: "  Ăn uống  ",
        account: "  Tiền mặt  ",
        note: "  bữa trưa   văn phòng  ",
      },
      { referenceDate },
    );

    expect(result.transaction).toEqual({
      type: "expense",
      amount: 120_000,
      date: "2026-06-13",
      category: "Ăn uống",
      account: "Tiền mặt",
      note: "bữa trưa văn phòng",
    });
    expect(result.issues).toContainEqual({
      field: "type",
      message: "Số tiền âm được ưu tiên phân loại là chi tiêu.",
    });
  });

  it("keeps explicit expense type for positive amounts", () => {
    const result = normalizeTransactionRow(
      { amount: "120000", date: "13/6", type: "expense", category: "Ăn uống", account: "Tiền mặt" },
      { referenceDate },
    );

    expect(result.transaction?.type).toBe("expense");
    expect(result.transaction?.amount).toBe(120_000);
  });

  it("returns safe issues for bad rows", () => {
    const result = normalizeTransactionRow({ amount: "abc", date: "31/2/2026", category: " ", account: "" }, { referenceDate });

    expect(result.transaction).toBeNull();
    expect(result.confidence).toBeLessThan(1);
    expect(result.issues.map((issue) => issue.field)).toEqual(["amount", "date", "category", "account"]);
  });
});
