import { describe, expect, it } from "vitest";
import { detectTransactionDuplicates, generateTransactionSourceHash } from "./dedupe";
import type { NormalizedTransactionInput } from "./normalize";
import type { Transaction } from "@/lib/types";

const baseRow: NormalizedTransactionInput = {
  type: "expense",
  amount: 120_000,
  date: "2026-06-13",
  category: "Ăn uống",
  account: "Tiền mặt",
  note: "Bữa trưa",
};

describe("transaction dedupe", () => {
  it("generates stable hashes from normalized fields", () => {
    const hashA = generateTransactionSourceHash(baseRow);
    const hashB = generateTransactionSourceHash({
      ...baseRow,
      amount: 120000.0,
      account: "  tiền   mặt ",
      note: " bữa trưa ",
    });

    expect(hashA).toBe(hashB);
  });

  it("detects duplicates inside the same batch", () => {
    const result = detectTransactionDuplicates([
      baseRow,
      { ...baseRow, category: "Ăn ngoài" },
      { ...baseRow, note: "Bữa tối" },
    ]);

    expect(result.map((row) => row.status)).toEqual(["unique", "duplicate_in_batch", "unique"]);
    expect(result[1].duplicateOfRowIndex).toBe(0);
    expect(result[1].reason).toBe("Trùng với dòng khác trong cùng batch import.");
  });

  it("detects duplicates against existing transactions", () => {
    const existing: Transaction[] = [
      {
        id: "transaction-1",
        type: "expense",
        amount: 120_000,
        date: "2026-06-13",
        category: "Khác",
        account: "tiền mặt",
        note: "bữa trưa",
      },
    ];

    const result = detectTransactionDuplicates([baseRow], existing);

    expect(result[0]).toMatchObject({
      status: "duplicate_existing",
      duplicateOfTransactionId: "transaction-1",
      reason: "Trùng với giao dịch đã tồn tại.",
    });
  });

  it("does not mutate rows while returning source hashes", () => {
    const row = { ...baseRow };
    const result = detectTransactionDuplicates([row]);

    expect(row).toEqual(baseRow);
    expect(result[0].sourceHash).toMatch(/^[a-f0-9]{8}$/);
  });
});
