import { describe, expect, it } from "vitest";
import { parseTransactionsCsv, transactionsToCsv } from "./csv";

describe("csv utilities", () => {
  it("parses valid rows and reports invalid rows", () => {
    const result = parseTransactionsCsv(
      "date,type,amount,category,account,note\n2026-06-09,expense,120000,Ăn uống,Tiền mặt,Bữa trưa\nbad,expense,-1,,,\n",
    );

    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });

  it("exports transactions to csv", () => {
    const csv = transactionsToCsv([
      { id: "1", date: "2026-06-09", type: "income", amount: 1000, category: "Lương", account: "Bank" },
    ]);

    expect(csv).toContain("date,type,amount,category,account,note");
    expect(csv).toContain("2026-06-09,income,1000");
  });
});
