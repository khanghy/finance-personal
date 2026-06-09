# Architecture

## Stack

- Next.js App Router, TypeScript, React Server Components.
- Tailwind CSS và shadcn/ui-style primitives.
- Supabase Auth, Postgres, Row Level Security.
- Vercel hosting.
- AI provider adapter để có thể thay OpenAI hoặc provider khác.

## App layers

- `src/app`: routes, layouts, page composition.
- `src/components`: UI primitives và feature components.
- `src/lib`: domain logic, Supabase clients, AI adapter, CSV parser.
- `supabase/migrations`: database schema và RLS.
- `docs`: product/technical specs.

## Runtime flow

1. User đăng nhập qua Supabase magic link.
2. Server components lấy user session bằng Supabase SSR client.
3. Server actions/API routes ghi dữ liệu vào Supabase.
4. Domain functions tính dashboard, debt strategy và notification.
5. AI route chỉ nhận snapshot đã sanitize, không gửi secret hoặc raw auth metadata.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL`

## Deployment

Vercel deploy Next.js app. Supabase migration chạy qua Supabase CLI hoặc SQL editor trước khi mở app production. Không expose service role key trên client.
