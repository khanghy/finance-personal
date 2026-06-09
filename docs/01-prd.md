# PRD - Web quản lý tài chính cá nhân

## Mục tiêu

Xây dựng một web app cá nhân giúp người dùng Việt Nam theo dõi thu nhập, chi tiêu, nợ, hạn thanh toán và nhận đề xuất tối ưu tài chính từ AI. MVP phải dùng được cho một người sau đăng nhập, ưu tiên nhập tay và CSV, chưa tích hợp ngân hàng thật.

## Người dùng chính

- Cá nhân có nhiều nguồn thu, nhiều khoản chi, và muốn nhìn rõ dòng tiền theo tháng.
- Người đang có nợ vay/thẻ tín dụng/trả góp và cần kế hoạch trả nợ có thứ tự ưu tiên.
- Người muốn một cố vấn AI giải thích rủi ro và gợi ý hành động, nhưng vẫn tự quyết định.

## Phạm vi MVP

- Đăng nhập bằng Supabase Auth magic link.
- Dashboard tổng quan thu nhập, chi tiêu, dòng tiền ròng, tổng nợ, nợ đến hạn và tỷ lệ nợ/thu nhập.
- CRUD giao dịch thu nhập/chi tiêu với tài khoản, danh mục, ngày, ghi chú và recurring flag.
- CSV import/export cho giao dịch.
- CRUD khoản nợ, ghi nhận thanh toán nợ, tính kế hoạch avalanche và snowball.
- In-app notification cho nợ sắp đến hạn, nợ quá hạn và cảnh báo dòng tiền.
- AI advisor provider-agnostic, trả về cảnh báo, lý do, hành động đề xuất và disclaimer.

## Ngoài phạm vi MVP

- Tích hợp ngân hàng, ví điện tử hoặc open banking.
- Email, push notification, SMS.
- Multi-user sharing, gia đình/nhóm, phân quyền nâng cao.
- Billing, subscription, SaaS public.
- AI tự động sửa dữ liệu hoặc tự tạo giao dịch.

## Success criteria

- Người dùng có thể nhập dữ liệu tài chính trong 10 phút và xem dashboard có ý nghĩa.
- Kế hoạch trả nợ hiển thị được cả avalanche và snowball với số liệu dễ hiểu.
- AI advisor không làm thay người dùng, chỉ đề xuất có giải thích và mức rủi ro.
- RLS bảo vệ mọi dữ liệu theo `user_id`.
- App build được trên Vercel với env vars rõ ràng.
