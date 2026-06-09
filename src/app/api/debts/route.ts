import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ensureAuthenticatedUser, getFinanceData } from "@/lib/data";

const createDebtSchema = z.object({
  name: z.string().min(1),
  principalAmount: z.coerce.number().nonnegative(),
  currentBalance: z.coerce.number().nonnegative(),
  interestRate: z.coerce.number().nonnegative(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minimumPayment: z.coerce.number().nonnegative(),
});

export async function GET() {
  const data = await getFinanceData();
  return NextResponse.json({ mode: data.mode, debts: data.debts });
}

export async function POST(request: NextRequest) {
  try {
    const body = createDebtSchema.parse(await request.json());
    const { supabase, user } = await ensureAuthenticatedUser();
    const result = await supabase
      .from("debts")
      .insert({
        user_id: user.id,
        name: body.name,
        principal_amount: body.principalAmount,
        current_balance: body.currentBalance,
        interest_rate: body.interestRate,
        due_date: body.dueDate,
        minimum_payment: body.minimumPayment,
        status: getDebtStatus(body.currentBalance, body.dueDate),
      })
      .select("id")
      .single();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({ id: result.data.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Có lỗi xảy ra." }, { status: 400 });
  }
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
