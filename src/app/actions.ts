"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseTransactionsCsv } from "@/lib/csv";
import { ensureAuthenticatedUser, findOrCreateAccount, findOrCreateCategory } from "@/lib/data";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  account: z.string().min(1),
  note: z.string().optional(),
  isRecurring: z.coerce.boolean().optional(),
});

const debtSchema = z.object({
  name: z.string().min(1),
  principalAmount: z.coerce.number().nonnegative(),
  currentBalance: z.coerce.number().nonnegative(),
  interestRate: z.coerce.number().nonnegative(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minimumPayment: z.coerce.number().nonnegative(),
});

const debtPaymentSchema = z.object({
  debtId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional(),
});

export async function createTransactionAction(formData: FormData) {
  try {
    const values = transactionSchema.parse(Object.fromEntries(formData));
    const { supabase, user } = await ensureAuthenticatedUser();
    const [accountId, categoryId] = await Promise.all([
      findOrCreateAccount(user.id, values.account),
      findOrCreateCategory(user.id, values.category, values.type),
    ]);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId,
      type: values.type,
      amount: values.amount,
      transaction_date: values.date,
      note: values.note,
      is_recurring: Boolean(values.isRecurring),
    });

    if (error) throw new Error(error.message);
  } catch (error) {
    redirect(`/?tab=transactions&error=${encodeURIComponent(getErrorMessage(error))}`);
  }

  revalidatePath("/");
  redirect("/?tab=transactions&saved=transaction");
}

export async function createDebtAction(formData: FormData) {
  try {
    const values = debtSchema.parse(Object.fromEntries(formData));
    const { supabase, user } = await ensureAuthenticatedUser();

    const { error } = await supabase.from("debts").insert({
      user_id: user.id,
      name: values.name,
      principal_amount: values.principalAmount,
      current_balance: values.currentBalance,
      interest_rate: values.interestRate,
      due_date: values.dueDate,
      minimum_payment: values.minimumPayment,
      status: getDebtStatus(values.currentBalance, values.dueDate),
    });

    if (error) throw new Error(error.message);
  } catch (error) {
    redirect(`/?tab=debts&error=${encodeURIComponent(getErrorMessage(error))}`);
  }

  revalidatePath("/");
  redirect("/?tab=debts&saved=debt");
}

export async function createDebtPaymentAction(formData: FormData) {
  try {
    const values = debtPaymentSchema.parse(Object.fromEntries(formData));
    const { supabase } = await ensureAuthenticatedUser();

    const { error } = await supabase.rpc("record_debt_payment", {
      target_debt_id: values.debtId,
      payment_amount: values.amount,
      payment_date: values.paidAt,
      payment_note: values.note ?? null,
    });

    if (error) throw new Error(error.message);
  } catch (error) {
    redirect(`/?tab=debts&error=${encodeURIComponent(getErrorMessage(error))}`);
  }

  revalidatePath("/");
  redirect("/?tab=debts&saved=payment");
}

export async function importTransactionsCsvAction(formData: FormData) {
  try {
    const file = formData.get("csv");

    if (!(file instanceof File)) {
      throw new Error("Không tìm thấy file CSV.");
    }

    const csvText = await file.text();
    const parsed = parseTransactionsCsv(csvText);

    if (parsed.validRows.length === 0) {
      throw new Error(parsed.errors[0]?.message ?? "CSV không có dòng hợp lệ.");
    }

    const { supabase, user } = await ensureAuthenticatedUser();
    const rows = [];

    for (const row of parsed.validRows) {
      const [accountId, categoryId] = await Promise.all([
        findOrCreateAccount(user.id, row.account),
        findOrCreateCategory(user.id, row.category, row.type),
      ]);

      rows.push({
        user_id: user.id,
        account_id: accountId,
        category_id: categoryId,
        type: row.type,
        amount: row.amount,
        transaction_date: row.date,
        note: row.note,
        is_recurring: false,
      });
    }

    const { error } = await supabase.from("transactions").insert(rows);
    if (error) throw new Error(error.message);

    await supabase.from("csv_imports").insert({
      user_id: user.id,
      file_name: file.name,
      total_rows: parsed.validRows.length + parsed.errors.length,
      imported_rows: parsed.validRows.length,
      failed_rows: parsed.errors.length,
    });
  } catch (error) {
    redirect(`/?tab=import&error=${encodeURIComponent(getErrorMessage(error))}`);
  }

  revalidatePath("/");
  redirect("/?tab=import&saved=csv");
}

export async function markNotificationReadAction(formData: FormData) {
  try {
    const id = z.string().uuid().parse(formData.get("id"));
    const { supabase, user } = await ensureAuthenticatedUser();
    const { error } = await supabase.from("notifications").update({ status: "read" }).eq("id", id).eq("user_id", user.id);
    if (error) throw new Error(error.message);
  } catch (error) {
    redirect(`/?tab=notifications&error=${encodeURIComponent(getErrorMessage(error))}`);
  }

  revalidatePath("/");
  redirect("/?tab=notifications");
}

function getDebtStatus(balance: number, dueDate: string) {
  if (balance <= 0) return "paid";

  const today = new Date();
  const due = new Date(`${dueDate}T00:00:00`);
  const days = Math.ceil((Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86_400_000);

  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "active";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Có lỗi xảy ra.";
}
