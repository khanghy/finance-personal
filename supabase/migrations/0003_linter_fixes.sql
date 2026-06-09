create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "profiles own rows" on profiles;
drop policy if exists "accounts own rows" on accounts;
drop policy if exists "categories own rows" on categories;
drop policy if exists "transactions own rows" on transactions;
drop policy if exists "debts own rows" on debts;
drop policy if exists "debt_payments own rows" on debt_payments;
drop policy if exists "notifications own rows" on notifications;
drop policy if exists "ai_advice_sessions own rows" on ai_advice_sessions;
drop policy if exists "csv_imports own rows" on csv_imports;

create policy "profiles own rows" on profiles for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "accounts own rows" on accounts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories own rows" on categories for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions own rows" on transactions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "debts own rows" on debts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "debt_payments own rows" on debt_payments for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notifications own rows" on notifications for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ai_advice_sessions own rows" on ai_advice_sessions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "csv_imports own rows" on csv_imports for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index accounts_user_id_idx on accounts(user_id);
create index csv_imports_user_id_idx on csv_imports(user_id);
create index debt_payments_user_id_idx on debt_payments(user_id);
create index debt_payments_debt_id_idx on debt_payments(debt_id);
create index notifications_related_debt_id_idx on notifications(related_debt_id);
create index transactions_account_id_idx on transactions(account_id);
create index transactions_category_id_idx on transactions(category_id);
