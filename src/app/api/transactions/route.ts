import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ensureAuthenticatedUser, findOrCreateAccount, findOrCreateCategory, getFinanceData } from "@/lib/data";

const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  account: z.string().min(1),
  note: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

export async function GET() {
  const data = await getFinanceData();
  return NextResponse.json({ mode: data.mode, transactions: data.transactions });
}

export async function POST(request: NextRequest) {
  try {
    const body = createTransactionSchema.parse(await request.json());
    const { supabase, user } = await ensureAuthenticatedUser();
    const [accountId, categoryId] = await Promise.all([
      findOrCreateAccount(user.id, body.account),
      findOrCreateCategory(user.id, body.category, body.type),
    ]);
    const result = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: accountId,
        category_id: categoryId,
        type: body.type,
        amount: body.amount,
        transaction_date: body.date,
        note: body.note,
        is_recurring: Boolean(body.isRecurring),
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
