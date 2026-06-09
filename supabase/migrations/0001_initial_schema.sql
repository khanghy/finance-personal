create extension if not exists "pgcrypto";

create type transaction_type as enum ('income', 'expense');
create type debt_status as enum ('active', 'due_soon', 'overdue', 'paid');
create type notification_status as enum ('unread', 'read', 'dismissed');
create type notification_type as enum ('debt_due_soon', 'debt_overdue', 'negative_cashflow', 'minimum_payment_risk');
create type ai_risk_level as enum ('low', 'medium', 'high', 'critical');

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'vi-VN',
  currency text not null default 'VND',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'cash',
  opening_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type transaction_type not null,
  color text not null default '#0f766e',
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  type transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  transaction_date date not null,
  note text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  principal_amount numeric(14, 2) not null check (principal_amount >= 0),
  current_balance numeric(14, 2) not null check (current_balance >= 0),
  interest_rate numeric(6, 3) not null default 0,
  due_date date not null,
  minimum_payment numeric(14, 2) not null default 0,
  status debt_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references debts(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  paid_at date not null,
  note text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  status notification_status not null default 'unread',
  due_at timestamptz,
  related_debt_id uuid references debts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table ai_advice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text,
  input_snapshot jsonb not null,
  result jsonb not null,
  risk_level ai_risk_level not null,
  created_at timestamptz not null default now()
);

create table csv_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  failed_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on transactions(user_id, transaction_date desc);
create index transactions_user_type_idx on transactions(user_id, type);
create index debts_user_due_date_idx on debts(user_id, due_date);
create index debts_user_status_idx on debts(user_id, status);
create index notifications_user_status_due_idx on notifications(user_id, status, due_at);
create index ai_advice_sessions_user_created_idx on ai_advice_sessions(user_id, created_at desc);

alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table debts enable row level security;
alter table debt_payments enable row level security;
alter table notifications enable row level security;
alter table ai_advice_sessions enable row level security;
alter table csv_imports enable row level security;

create policy "profiles own rows" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts own rows" on accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories own rows" on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions own rows" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debts own rows" on debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debt_payments own rows" on debt_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications own rows" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_advice_sessions own rows" on ai_advice_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "csv_imports own rows" on csv_imports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
