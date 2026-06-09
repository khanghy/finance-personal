# Database schema

## Tables

- `profiles`: user profile, locale, currency.
- `accounts`: tài khoản nhập tay.
- `categories`: nhóm thu/chi.
- `transactions`: giao dịch thu nhập/chi tiêu.
- `debts`: khoản nợ.
- `debt_payments`: lịch sử trả nợ.
- `notifications`: notification trong app.
- `ai_advice_sessions`: lịch sử AI advisor.
- `csv_imports`: metadata import CSV.

## RLS

Mọi bảng user-owned có `user_id uuid not null references auth.users(id)` và policy:

- `select`: `auth.uid() = user_id`
- `insert`: `auth.uid() = user_id`
- `update`: `auth.uid() = user_id`
- `delete`: `auth.uid() = user_id`

## Indexes

- `transactions(user_id, transaction_date desc)`
- `transactions(user_id, type)`
- `debts(user_id, due_date)`
- `debts(user_id, status)`
- `notifications(user_id, status, due_at)`
- `ai_advice_sessions(user_id, created_at desc)`

## Migration notes

Schema MVP nằm trong `supabase/migrations/0001_initial_schema.sql`. Các enum được khai báo ở Postgres để tránh trạng thái rời rạc giữa client và database.
