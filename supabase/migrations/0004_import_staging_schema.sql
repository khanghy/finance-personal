create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('csv', 'notion', 'manual')),
  file_name text,
  external_source_id text,
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'imported', 'failed', 'cancelled')),
  total_rows integer not null default 0,
  ready_rows integer not null default 0,
  needs_review_rows integer not null default 0,
  rejected_rows integer not null default 0,
  imported_rows integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table import_raw_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references import_batches(id) on delete cascade,
  row_index integer not null,
  raw_data jsonb not null,
  external_id text,
  source_hash text,
  created_at timestamptz not null default now()
);

create table import_clean_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references import_batches(id) on delete cascade,
  raw_row_id uuid references import_raw_rows(id) on delete set null,
  status text not null default 'needs_review' check (status in ('ready', 'needs_review', 'rejected', 'approved', 'imported')),
  transaction_type transaction_type,
  amount numeric(14, 2),
  transaction_date date,
  category_name text,
  account_name text,
  note text,
  confidence numeric(4, 3) not null default 0,
  issues jsonb not null default '[]'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  duplicate_of_transaction_id uuid references transactions(id) on delete set null,
  source_hash text,
  imported_transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table category_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null,
  category_id uuid references categories(id) on delete cascade,
  transaction_type transaction_type not null,
  created_at timestamptz not null default now(),
  unique (user_id, alias, transaction_type)
);

create table account_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null,
  account_id uuid references accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, alias)
);

create index import_batches_user_created_idx on import_batches(user_id, created_at desc);
create index import_batches_user_status_idx on import_batches(user_id, status);
create index import_raw_rows_user_batch_idx on import_raw_rows(user_id, batch_id);
create index import_raw_rows_user_source_hash_idx on import_raw_rows(user_id, source_hash);
create index import_clean_rows_user_batch_idx on import_clean_rows(user_id, batch_id);
create index import_clean_rows_user_status_idx on import_clean_rows(user_id, status);
create index import_clean_rows_user_source_hash_idx on import_clean_rows(user_id, source_hash);
create index category_aliases_user_alias_idx on category_aliases(user_id, alias);
create index account_aliases_user_alias_idx on account_aliases(user_id, alias);

alter table import_batches enable row level security;
alter table import_raw_rows enable row level security;
alter table import_clean_rows enable row level security;
alter table category_aliases enable row level security;
alter table account_aliases enable row level security;

create policy "import_batches own rows" on import_batches for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "import_raw_rows own rows" on import_raw_rows for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "import_clean_rows own rows" on import_clean_rows for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "category_aliases own rows" on category_aliases for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "account_aliases own rows" on account_aliases for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop trigger if exists import_batches_set_updated_at on import_batches;
create trigger import_batches_set_updated_at
before update on import_batches
for each row execute function set_updated_at();

drop trigger if exists import_clean_rows_set_updated_at on import_clean_rows;
create trigger import_clean_rows_set_updated_at
before update on import_clean_rows
for each row execute function set_updated_at();
