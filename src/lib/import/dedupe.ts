import type { Transaction } from "@/lib/types";
import type { NormalizedTransactionInput } from "./normalize";

export type ImportRowForDedupe = NormalizedTransactionInput & {
  rowId?: string;
};

export type DuplicateStatus = "unique" | "duplicate_in_batch" | "duplicate_existing";

export type DuplicateDetectionResult = {
  row: ImportRowForDedupe;
  sourceHash: string;
  status: DuplicateStatus;
  reason?: string;
  duplicateOfRowIndex?: number;
  duplicateOfTransactionId?: string;
};

export function generateTransactionSourceHash(input: NormalizedTransactionInput): string {
  return fnv1aHash(normalizeHashParts(input).join("|"));
}

export function detectTransactionDuplicates(
  rows: ImportRowForDedupe[],
  existingTransactions: Transaction[] = [],
): DuplicateDetectionResult[] {
  const existingByHash = new Map(
    existingTransactions.map((transaction) => [
      generateTransactionSourceHash({
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        category: transaction.category,
        account: transaction.account,
        note: transaction.note,
      }),
      transaction,
    ]),
  );
  const firstBatchRowByHash = new Map<string, number>();

  return rows.map((row, index) => {
    const sourceHash = generateTransactionSourceHash(row);
    const existing = existingByHash.get(sourceHash);
    if (existing) {
      return {
        row,
        sourceHash,
        status: "duplicate_existing",
        reason: "Trùng với giao dịch đã tồn tại.",
        duplicateOfTransactionId: existing.id,
      };
    }

    const firstIndex = firstBatchRowByHash.get(sourceHash);
    if (firstIndex != null) {
      return {
        row,
        sourceHash,
        status: "duplicate_in_batch",
        reason: "Trùng với dòng khác trong cùng batch import.",
        duplicateOfRowIndex: firstIndex,
      };
    }

    firstBatchRowByHash.set(sourceHash, index);
    return { row, sourceHash, status: "unique" };
  });
}

function normalizeHashParts(input: NormalizedTransactionInput): string[] {
  return [
    input.date.trim(),
    Number(input.amount).toFixed(2),
    input.type.trim().toLowerCase(),
    normalizeHashText(input.account),
    normalizeHashText(input.note ?? ""),
  ];
}

function normalizeHashText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function fnv1aHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
