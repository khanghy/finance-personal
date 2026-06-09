import Papa from "papaparse";
import { z } from "zod";
import type { Transaction } from "./types";

const csvTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  account: z.string().min(1),
  note: z.string().optional().default(""),
});

export type CsvImportResult = {
  validRows: Omit<Transaction, "id">[];
  errors: { row: number; message: string }[];
};

export function parseTransactionsCsv(csvText: string): CsvImportResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const validRows: Omit<Transaction, "id">[] = [];
  const errors: { row: number; message: string }[] = [];

  parsed.data.forEach((row, index) => {
    const result = csvTransactionSchema.safeParse(row);

    if (!result.success) {
      errors.push({
        row: index + 2,
        message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      });
      return;
    }

    validRows.push({
      type: result.data.type,
      amount: result.data.amount,
      date: result.data.date,
      category: result.data.category,
      account: result.data.account,
      note: result.data.note,
    });
  });

  for (const error of parsed.errors) {
    errors.push({ row: error.row ? error.row + 1 : 1, message: error.message });
  }

  return { validRows, errors };
}

export function transactionsToCsv(transactions: Transaction[]) {
  return Papa.unparse(
    transactions.map((transaction) => ({
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      account: transaction.account,
      note: transaction.note ?? "",
    })),
  );
}
