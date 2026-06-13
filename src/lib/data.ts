import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { debts as demoDebts, transactions as demoTransactions } from "@/lib/mock-data";
import type { AppNotification, Debt, Transaction } from "@/lib/types";

export type FinanceData = {
  mode: "demo" | "authenticated" | "anonymous" | "error";
  userId?: string;
  transactions: Transaction[];
  debts: Debt[];
  notifications: AppNotification[];
  errorMessage?: string;
};

export async function getFinanceData(): Promise<FinanceData> {
  if (!isSupabaseConfigured()) {
    return { mode: "demo", transactions: demoTransactions, debts: demoDebts, notifications: [] };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mode: "anonymous", transactions: demoTransactions, debts: demoDebts, notifications: [] };
  }

  await ensureDefaultProfile(user.id);

  const [transactionsResult, debtsResult, notificationsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("id,type,amount,transaction_date,note,is_recurring,accounts(name),categories(name)")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(100),
    supabase.from("debts").select("*").eq("user_id", user.id).order("due_date", { ascending: true }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (transactionsResult.error || debtsResult.error || notificationsResult.error) {
    const error = transactionsResult.error ?? debtsResult.error ?? notificationsResult.error;
    console.error(error);
    return {
      mode: "error",
      userId: user.id,
      transactions: [],
      debts: [],
      notifications: [],
      errorMessage: error?.message ?? "Không thể tải dữ liệu tài chính từ Supabase.",
    };
  }

  return {
    mode: "authenticated",
    userId: user.id,
    transactions: (transactionsResult.data ?? []).map(mapTransactionRow),
    debts: (debtsResult.data ?? []).map(mapDebtRow),
    notifications: (notificationsResult.data ?? []).map(mapNotificationRow),
  };
}

export async function ensureAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase chưa được cấu hình. Hãy tạo .env.local từ .env.example.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn cần đăng nhập để ghi dữ liệu.");
  }

  await ensureDefaultProfile(user.id);
  return { supabase, user };
}

export async function ensureDefaultProfile(userId: string) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("profiles").upsert(
    {
      user_id: userId,
      locale: "vi-VN",
      currency: "VND",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function findOrCreateAccount(userId: string, name: string) {
  const supabase = await createSupabaseServerClient();
  const normalizedName = name.trim() || "Tài khoản chính";
  const existing = await supabase.from("accounts").select("id").eq("user_id", userId).eq("name", normalizedName).maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const inserted = await supabase
    .from("accounts")
    .insert({ user_id: userId, name: normalizedName, type: "manual" })
    .select("id")
    .single();

  if (inserted.error) {
    throw new Error(inserted.error.message);
  }

  return inserted.data.id as string;
}

export async function findOrCreateCategory(userId: string, name: string, type: Transaction["type"]) {
  const supabase = await createSupabaseServerClient();
  const normalizedName = name.trim() || (type === "income" ? "Thu nhập khác" : "Chi tiêu khác");
  const existing = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", normalizedName)
    .eq("type", type)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const inserted = await supabase
    .from("categories")
    .insert({ user_id: userId, name: normalizedName, type })
    .select("id")
    .single();

  if (inserted.error) {
    throw new Error(inserted.error.message);
  }

  return inserted.data.id as string;
}

function mapTransactionRow(row: Record<string, unknown>): Transaction {
  const account = row.accounts as { name?: string } | { name?: string }[] | null;
  const category = row.categories as { name?: string } | { name?: string }[] | null;

  return {
    id: String(row.id),
    type: row.type as Transaction["type"],
    amount: Number(row.amount),
    date: String(row.transaction_date),
    category: Array.isArray(category) ? category[0]?.name ?? "Chưa phân loại" : category?.name ?? "Chưa phân loại",
    account: Array.isArray(account) ? account[0]?.name ?? "Tài khoản chính" : account?.name ?? "Tài khoản chính",
    note: row.note ? String(row.note) : undefined,
    isRecurring: Boolean(row.is_recurring),
  };
}

function mapDebtRow(row: Record<string, unknown>): Debt {
  return {
    id: String(row.id),
    name: String(row.name),
    principalAmount: Number(row.principal_amount),
    currentBalance: Number(row.current_balance),
    interestRate: Number(row.interest_rate),
    dueDate: String(row.due_date),
    minimumPayment: Number(row.minimum_payment),
    status: row.status as Debt["status"],
  };
}

function mapNotificationRow(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    type: row.type as AppNotification["type"],
    title: String(row.title),
    body: String(row.body),
    status: row.status as AppNotification["status"],
    dueAt: row.due_at ? String(row.due_at) : undefined,
    relatedDebtId: row.related_debt_id ? String(row.related_debt_id) : undefined,
  };
}
