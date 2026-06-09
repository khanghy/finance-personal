# AI advisor

## Vai trò

AI là cố vấn tài chính cá nhân, không phải tư vấn tài chính chuyên nghiệp. AI chỉ phân tích dữ liệu, giải thích rủi ro và đề xuất hành động. AI không tự tạo, sửa, xóa giao dịch hoặc khoản nợ.

## Input contract

AI nhận snapshot đã sanitize:

- `monthlyIncome`
- `monthlyExpense`
- `netCashflow`
- `debts`
- `upcomingDueDebts`
- `overdueDebts`
- `debtStrategies`
- `recentTransactionsSummary`

## Output contract

Kết quả trả về:

- `summary`: tóm tắt ngắn.
- `riskLevel`: `low`, `medium`, `high`, `critical`.
- `actions`: danh sách hành động có title, reason, impact và urgency.
- `debtRecommendation`: avalanche, snowball hoặc crisis-first.
- `disclaimer`: cảnh báo AI không thay thế chuyên gia tài chính.

## Guardrails

- Không khuyến nghị vay thêm rủi ro cao để trả nợ nếu không nêu rõ rủi ro.
- Không đưa lời khuyên pháp lý, thuế hoặc đầu tư chắc chắn.
- Không thao tác dữ liệu thay người dùng.
- Khi dòng tiền âm hoặc có nợ quá hạn, ưu tiên chế độ khủng hoảng: thanh toán tối thiểu, tránh phí phạt, liên hệ chủ nợ, giảm chi phí thiết yếu.

## Provider adapter

Interface chính:

```ts
generateAdvice(input: AdviceInput): Promise<AdviceResult>
```

Provider mặc định có thể là OpenAI, nhưng app giữ lớp adapter để đổi provider bằng env var.
