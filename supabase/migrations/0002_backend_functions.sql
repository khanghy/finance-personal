create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists debts_set_updated_at on debts;
create trigger debts_set_updated_at
before update on debts
for each row execute function set_updated_at();

create or replace function record_debt_payment(
  target_debt_id uuid,
  payment_amount numeric,
  payment_date date,
  payment_note text default null
)
returns table (
  payment_id uuid,
  new_balance numeric
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_balance numeric;
  current_due_date date;
  inserted_payment_id uuid;
  next_balance numeric;
  next_status debt_status;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if payment_amount <= 0 then
    raise exception 'Payment amount must be positive';
  end if;

  select debts.current_balance, debts.due_date
  into current_balance, current_due_date
  from debts
  where debts.id = target_debt_id
    and debts.user_id = current_user_id
  for update;

  if current_balance is null then
    raise exception 'Debt not found';
  end if;

  next_balance := greatest(current_balance - payment_amount, 0);

  if next_balance = 0 then
    next_status := 'paid';
  elsif current_due_date < current_date then
    next_status := 'overdue';
  elsif current_due_date <= current_date + interval '7 days' then
    next_status := 'due_soon';
  else
    next_status := 'active';
  end if;

  insert into debt_payments (user_id, debt_id, amount, paid_at, note)
  values (current_user_id, target_debt_id, payment_amount, payment_date, payment_note)
  returning id into inserted_payment_id;

  update debts
  set current_balance = next_balance,
      status = next_status
  where debts.id = target_debt_id
    and debts.user_id = current_user_id;

  return query select inserted_payment_id, next_balance;
end;
$$;
