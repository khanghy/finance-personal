import type { TransactionType } from "@/lib/types";

export type RawTransactionRow = {
  amount?: unknown;
  date?: unknown;
  type?: unknown;
  category?: unknown;
  account?: unknown;
  note?: unknown;
};

export type NormalizedTransactionInput = {
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  account: string;
  note?: string;
};

export type NormalizeIssue = {
  field: keyof RawTransactionRow | "row";
  message: string;
};

export type NormalizeTransactionResult = {
  transaction: NormalizedTransactionInput | null;
  confidence: number;
  issues: NormalizeIssue[];
};

export type NormalizeTransactionOptions = {
  referenceDate?: Date;
};

export function normalizeTransactionRow(
  row: RawTransactionRow,
  options: NormalizeTransactionOptions = {},
): NormalizeTransactionResult {
  const issues: NormalizeIssue[] = [];
  const amountResult = normalizeAmount(row.amount);
  const dateResult = normalizeDate(row.date, options.referenceDate ?? new Date());
  const explicitType = normalizeType(row.type);
  const category = cleanText(row.category);
  const account = cleanText(row.account);
  const note = cleanText(row.note);

  if (!amountResult) {
    issues.push({ field: "amount", message: "Số tiền không hợp lệ." });
  }

  if (!dateResult) {
    issues.push({ field: "date", message: "Ngày giao dịch không hợp lệ." });
  }

  if (row.type != null && !explicitType) {
    issues.push({ field: "type", message: "Loại giao dịch không hợp lệ." });
  }

  if (!category) {
    issues.push({ field: "category", message: "Thiếu danh mục." });
  }

  if (!account) {
    issues.push({ field: "account", message: "Thiếu tài khoản." });
  }

  if (!amountResult || !dateResult || !category || !account) {
    return { transaction: null, confidence: confidenceFromIssues(issues), issues };
  }

  const inferredType = amountResult.signedAmount < 0 ? "expense" : explicitType ?? "income";
  if (amountResult.signedAmount < 0 && explicitType === "income") {
    issues.push({ field: "type", message: "Số tiền âm được ưu tiên phân loại là chi tiêu." });
  }

  return {
    transaction: {
      type: inferredType,
      amount: Math.abs(amountResult.signedAmount),
      date: dateResult,
      category,
      account,
      ...(note ? { note } : {}),
    },
    confidence: confidenceFromIssues(issues),
    issues,
  };
}

function normalizeAmount(value: unknown): { signedAmount: number } | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value === 0 ? null : { signedAmount: value };
  }

  const raw = cleanText(value).toLowerCase();
  if (!raw) return null;

  const isParenthesizedNegative = raw.startsWith("(") && raw.endsWith(")");
  const sign = raw.includes("-") || isParenthesizedNegative ? -1 : 1;
  const compact = raw
    .replace(/[₫đvnd\s]/g, "")
    .replace(/[()]/g, "")
    .replace(/^\+|-+/g, "");

  const millionMatch = compact.match(/^(\d+(?:[.,]\d+)?)(?:tr|triệu|trieu)(\d*)$/i);
  if (millionMatch) {
    const whole = parseLocaleNumber(millionMatch[1]);
    if (whole == null) return null;
    const suffix = millionMatch[2] ? Number(`0.${millionMatch[2]}`) : 0;
    const amount = (whole + suffix) * 1_000_000;
    return amount > 0 ? { signedAmount: sign * amount } : null;
  }

  const thousandMatch = compact.match(/^(\d+(?:[.,]\d+)?)k$/i);
  if (thousandMatch) {
    const amount = parseLocaleNumber(thousandMatch[1]);
    return amount && amount > 0 ? { signedAmount: sign * amount * 1_000 } : null;
  }

  const amount = parseLocaleNumber(compact);
  return amount && amount > 0 ? { signedAmount: sign * amount } : null;
}

function parseLocaleNumber(value: string): number | null {
  if (!value || !/^\d+(?:[.,]\d+)*$/.test(value)) return null;

  const separators = [...value.matchAll(/[.,]/g)].map((match) => match[0]);
  if (separators.length === 0) return Number(value);

  const lastSeparatorIndex = Math.max(value.lastIndexOf("."), value.lastIndexOf(","));
  const integerPart = value.slice(0, lastSeparatorIndex);
  const fractionPart = value.slice(lastSeparatorIndex + 1);
  const hasMixedSeparators = new Set(separators).size > 1;
  const isThousandsOnly = fractionPart.length === 3 && !hasMixedSeparators;

  const normalized = isThousandsOnly
    ? value.replace(/[.,]/g, "")
    : `${integerPart.replace(/[.,]/g, "")}.${fractionPart}`;
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function normalizeDate(value: unknown, referenceDate: Date): string | null {
  const raw = cleanText(value);
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return validDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const fullMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (fullMatch) {
    return validDate(Number(fullMatch[3]), Number(fullMatch[2]), Number(fullMatch[1]));
  }

  const dayMonthMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (dayMonthMatch) {
    return validDate(referenceDate.getFullYear(), Number(dayMonthMatch[2]), Number(dayMonthMatch[1]));
  }

  return null;
}

function validDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeType(value: unknown): TransactionType | null {
  const type = cleanText(value).toLowerCase();
  if (["income", "thu nhập", "thu nhap", "in"].includes(type)) return "income";
  if (["expense", "chi tiêu", "chi tieu", "out"].includes(type)) return "expense";
  return null;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function confidenceFromIssues(issues: NormalizeIssue[]): number {
  return Math.max(0, Number((1 - issues.length * 0.2).toFixed(3)));
}
