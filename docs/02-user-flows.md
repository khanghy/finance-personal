# User flows

## Đăng nhập

1. Người dùng nhập email.
2. App gọi Supabase magic link.
3. Người dùng mở link, được chuyển vào dashboard.
4. Nếu chưa có profile, app tạo profile mặc định `vi-VN`, `VND`.

## Nhập giao dịch

1. Mở mục Giao dịch.
2. Chọn loại thu nhập hoặc chi tiêu.
3. Nhập số tiền, ngày, danh mục, tài khoản, ghi chú.
4. App validate số tiền dương và ngày hợp lệ.
5. Sau khi lưu, dashboard cập nhật tổng thu, tổng chi và dòng tiền ròng.

## Import CSV

1. Người dùng tải CSV với cột `date,type,amount,category,account,note`.
2. App parse và hiển thị preview.
3. Dòng lỗi được giữ lại trong màn hình review, không import.
4. Người dùng xác nhận import các dòng hợp lệ.
5. App ghi metadata vào `csv_imports`.

## Quản lý nợ

1. Người dùng thêm khoản nợ với số dư hiện tại, lãi suất, hạn trả, khoản tối thiểu.
2. App hiển thị trạng thái: bình thường, sắp đến hạn, quá hạn, đã trả hết.
3. Người dùng ghi nhận thanh toán.
4. App giảm số dư nợ và cập nhật dashboard.

## Đề xuất trả nợ

1. Người dùng mở tab Trả nợ.
2. App tính avalanche theo lãi suất cao trước.
3. App tính snowball theo số dư nhỏ trước.
4. AI advisor giải thích tradeoff dựa trên dòng tiền và rủi ro.

## Notification trong app

1. Khi user mở dashboard hoặc dữ liệu thay đổi, app kiểm tra hạn nợ.
2. Nợ đến hạn trong 7 ngày tạo notification `debt_due_soon`.
3. Nợ quá hạn tạo notification `debt_overdue`.
4. Người dùng đánh dấu đã đọc hoặc bỏ qua.

## AI advisor

1. Người dùng mở mục AI Cố vấn.
2. App gom snapshot thu nhập, chi tiêu, nợ, notification và strategy trả nợ.
3. Server gọi AI provider qua adapter.
4. Kết quả gồm summary, risk level, recommended actions và disclaimer.
5. App lưu phiên phân tích vào `ai_advice_sessions`.
