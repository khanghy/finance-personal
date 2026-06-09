# Finance Personal

MVP web cá nhân quản lý thu nhập, chi tiêu, nợ, nhắc hạn trong app và AI cố vấn tài chính.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui-style primitives
- Supabase Auth/Postgres/RLS
- Vercel
- Vitest

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mặc định app có dữ liệu mẫu để kiểm tra dashboard trước khi nối Supabase thật.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Docs

Bộ tài liệu triển khai nằm trong `docs/`:

- PRD
- User flows
- Architecture
- Database schema
- AI advisor
- UI system
- Roadmap

## Supabase

Migration MVP nằm tại `supabase/migrations/0001_initial_schema.sql`. Trước production, tạo project Supabase, chạy migration, bật magic link và cấu hình env vars trên Vercel.

Backend hiện có:

- Server actions cho thêm giao dịch, thêm khoản nợ, ghi nhận trả nợ, import CSV và đánh dấu notification đã đọc.
- REST endpoints `GET/POST /api/transactions`, `GET/POST /api/debts`, `GET /api/notifications`, `POST /api/ai-advice`.
- SQL function `record_debt_payment` trong `supabase/migrations/0002_backend_functions.sql` để ghi payment và cập nhật số dư nợ atomically.
