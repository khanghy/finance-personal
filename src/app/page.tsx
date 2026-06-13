import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Brain,
  CalendarClock,
  CircleDollarSign,
  Database,
  Download,
  FileUp,
  Landmark,
  LogIn,
  Plus,
  ReceiptText,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CategoryExpenseChart, MonthlyCashflowChart } from "@/components/charts";
import {
  createDebtAction,
  createDebtPaymentAction,
  createTransactionAction,
  importTransactionsCsvAction,
  markNotificationReadAction,
} from "@/app/actions";
import {
  buildAvalanchePlan,
  buildSnowballPlan,
  calculateCashflow,
  calculateMonthlyCashflow,
  categoryExpenseSeries,
  filterTransactionsByMonth,
  monthlySeries,
} from "@/lib/finance";
import { getFinanceData } from "@/lib/data";
import { generateCashflowNotification, generateDebtNotifications } from "@/lib/notifications";
import { transactionsToCsv } from "@/lib/csv";
import { formatVnd } from "@/lib/utils";

const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "transactions", label: "Giao dịch" },
  { key: "debts", label: "Nợ" },
  { key: "notifications", label: "Nhắc nợ" },
  { key: "advisor", label: "AI Cố vấn" },
  { key: "import", label: "Import CSV" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; saved?: string; month?: string }>;
}) {
  const params = await searchParams;
  const activeTab = tabs.some((tab) => tab.key === params.tab) ? (params.tab as TabKey) : "dashboard";
  const selectedMonth = normalizeMonthParam(params.month);
  const data = await getFinanceData();
  const summary = calculateMonthlyCashflow(data.transactions, data.debts, selectedMonth);
  const selectedMonthTransactions = filterTransactionsByMonth(data.transactions, selectedMonth);
  const generatedNotifications = [
    ...generateDebtNotifications(data.debts),
    ...generateCashflowNotification(summary.net),
  ];
  const notifications = [...data.notifications, ...generatedNotifications];
  const avalanche = buildAvalanchePlan(data.debts);
  const snowball = buildSnowballPlan(data.debts);
  const csvExport = transactionsToCsv(data.transactions);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-medium text-teal-700">Finance Personal MVP</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">Quản lý tài chính cá nhân</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Các tab tách riêng dashboard, giao dịch, nợ, nhắc hạn, import CSV và AI cố vấn.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a href="/login">
                  <LogIn size={16} /> Đăng nhập
                </a>
              </Button>
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvExport)}`} download="finance-transactions.csv">
                  <Download size={16} /> Export CSV
                </a>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <nav className="flex gap-2 overflow-x-auto pb-1 text-sm">
              {tabs.map((tab) => (
                <a
                  className={`whitespace-nowrap rounded-md px-3 py-2 font-medium ${
                    activeTab === tab.key ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                  href={`/?tab=${tab.key}&month=${selectedMonth}`}
                  key={tab.key}
                >
                  {tab.label}
                </a>
              ))}
            </nav>
            <StatusBanner mode={data.mode} error={params.error} saved={params.saved} dataError={data.errorMessage} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        {data.mode === "error" ? <DataErrorState message={data.errorMessage} /> : null}
        {data.mode !== "error" && activeTab === "dashboard" ? (
          <DashboardTab
            summary={summary}
            selectedMonth={selectedMonth}
            transactions={data.transactions}
            selectedMonthTransactions={selectedMonthTransactions}
            debts={data.debts}
            notifications={notifications}
          />
        ) : null}
        {data.mode !== "error" && activeTab === "transactions" ? <TransactionsTab transactions={data.transactions} /> : null}
        {data.mode !== "error" && activeTab === "debts" ? <DebtsTab debts={data.debts} avalanche={avalanche} snowball={snowball} /> : null}
        {data.mode !== "error" && activeTab === "notifications" ? <NotificationsTab notifications={notifications} /> : null}
        {data.mode !== "error" && activeTab === "advisor" ? (
          <AdvisorTab summary={summary} debts={data.debts} avalanche={avalanche} snowball={snowball} />
        ) : null}
        {data.mode !== "error" && activeTab === "import" ? <ImportTab /> : null}
      </div>
    </main>
  );
}

function DashboardTab({
  summary,
  selectedMonth,
  transactions,
  selectedMonthTransactions,
  debts,
  notifications,
}: {
  summary: ReturnType<typeof calculateCashflow>;
  selectedMonth: string;
  transactions: Parameters<typeof monthlySeries>[0];
  selectedMonthTransactions: Parameters<typeof monthlySeries>[0];
  debts: Parameters<typeof buildAvalanchePlan>[0];
  notifications: ReturnType<typeof generateDebtNotifications>;
}) {
  return (
    <>
      <section className="flex flex-col justify-between gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-950">Tháng thống kê</p>
          <p className="mt-1 text-sm text-slate-500">Các thẻ chỉ số dùng giao dịch trong tháng được chọn.</p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <input name="tab" type="hidden" value="dashboard" />
          <Input className="w-40" name="month" type="month" defaultValue={selectedMonth} />
          <Button type="submit" variant="outline">Xem</Button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={<CircleDollarSign size={18} />} label="Thu nhập tháng" value={formatVnd(summary.income)} tone="teal" />
        <MetricCard icon={<ReceiptText size={18} />} label="Chi tiêu tháng" value={formatVnd(summary.expense)} tone="amber" />
        <MetricCard icon={<WalletCards size={18} />} label="Dòng tiền ròng" value={formatVnd(summary.net)} tone={summary.net >= 0 ? "teal" : "rose"} />
        <MetricCard icon={<Landmark size={18} />} label="Tổng nợ" value={formatVnd(summary.debtTotal)} tone="indigo" />
        <MetricCard icon={<ShieldAlert size={18} />} label="Nợ/thu nhập" value={`${Math.round(summary.debtToIncomeRatio * 100)}%`} tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thu chi theo tháng</CardTitle>
            <CardDescription>Tổng hợp từ bảng `transactions` hoặc dữ liệu demo khi chưa cấu hình Supabase.</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyCashflowChart data={monthlySeries(transactions)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cơ cấu chi tiêu</CardTitle>
            <CardDescription>Nhóm chi lớn nhất trong kỳ hiện tại.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryExpenseChart data={categoryExpenseSeries(selectedMonthTransactions)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <CompactList title="Giao dịch mới" items={transactions.slice(0, 5).map((item) => `${item.date} - ${item.category} - ${formatVnd(item.amount)}`)} />
        <CompactList title="Khoản nợ cần chú ý" items={debts.slice(0, 5).map((item) => `${item.name} - ${formatVnd(item.currentBalance)} - ${item.dueDate}`)} />
        <CompactList title="Nhắc hạn" items={notifications.slice(0, 5).map((item) => item.title)} />
      </section>
    </>
  );
}

function TransactionsTab({ transactions }: { transactions: Parameters<typeof monthlySeries>[0] }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch</CardTitle>
          <CardDescription>Dữ liệu được đọc từ Supabase khi đã đăng nhập; form bên phải ghi trực tiếp vào backend.</CardDescription>
        </CardHeader>
        <CardContent>
            <TransactionsView transactions={transactions} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Thêm giao dịch</CardTitle>
          <CardDescription>Server action sẽ tự tạo account/category nếu chưa tồn tại.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTransactionAction} className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Loại
              <select name="type" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value="expense">Chi tiêu</option>
                <option value="income">Thu nhập</option>
              </select>
            </label>
            <Field name="amount" label="Số tiền" type="number" placeholder="120000" />
            <Field name="date" label="Ngày" type="date" />
            <Field name="category" label="Danh mục" placeholder="Ăn uống" />
            <Field name="account" label="Tài khoản" placeholder="Tiền mặt" />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Ghi chú
              <Textarea name="note" placeholder="Ghi chú ngắn" />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input name="isRecurring" type="checkbox" value="true" /> Lặp lại
            </label>
            <Button type="submit">
              <Plus size={16} /> Lưu giao dịch
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function DebtsTab({
  debts,
  avalanche,
  snowball,
}: {
  debts: Parameters<typeof buildAvalanchePlan>[0];
  avalanche: ReturnType<typeof buildAvalanchePlan>;
  snowball: ReturnType<typeof buildSnowballPlan>;
}) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Khoản nợ</CardTitle>
            <CardDescription>Theo dõi số dư, lãi suất, hạn trả và khoản tối thiểu.</CardDescription>
          </CardHeader>
          <CardContent>
            <DebtsView debts={debts} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Thêm khoản nợ</CardTitle>
            <CardDescription>Backend tự tính trạng thái active/sắp đến hạn/quá hạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDebtAction} className="grid gap-3">
              <Field name="name" label="Tên khoản nợ" placeholder="Thẻ tín dụng" />
              <Field name="principalAmount" label="Số tiền gốc" type="number" />
              <Field name="currentBalance" label="Số dư hiện tại" type="number" />
              <Field name="interestRate" label="Lãi suất năm (%)" type="number" step="0.01" />
              <Field name="dueDate" label="Ngày đến hạn" type="date" />
              <Field name="minimumPayment" label="Khoản tối thiểu" type="number" />
              <Button type="submit">
                <Plus size={16} /> Lưu khoản nợ
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Chiến lược trả nợ</CardTitle>
            <CardDescription>So sánh avalanche và snowball.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DebtPlan title="Avalanche" description="Lãi suất cao trước" items={avalanche} />
            <DebtPlan title="Snowball" description="Số dư nhỏ trước" items={snowball} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ghi nhận trả nợ</CardTitle>
            <CardDescription>Server action ghi `debt_payments` và giảm `current_balance`.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDebtPaymentAction} className="grid gap-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Khoản nợ
                <select name="debtId" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                  {debts.map((debt) => (
                    <option key={debt.id} value={debt.id}>
                      {debt.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field name="amount" label="Số tiền trả" type="number" />
              <Field name="paidAt" label="Ngày trả" type="date" />
              <Field name="note" label="Ghi chú" placeholder="Thanh toán tối thiểu" />
              <Button type="submit">Ghi nhận thanh toán</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function NotificationsTab({ notifications }: { notifications: ReturnType<typeof generateDebtNotifications> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhắc nợ trong app</CardTitle>
        <CardDescription>Gồm notification lưu trong database và cảnh báo sinh từ dữ liệu hiện tại.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {notifications.length === 0 ? <EmptyState text="Chưa có nhắc hạn nào." /> : null}
        {notifications.map((notification) => (
          <div className="flex flex-col justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-start" key={notification.id}>
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 text-teal-700" size={17} />
              <div>
                <p className="font-medium text-slate-950">{notification.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{notification.body}</p>
              </div>
            </div>
            {notification.id.length === 36 ? (
              <form action={markNotificationReadAction}>
                <input name="id" type="hidden" value={notification.id} />
                <Button size="sm" variant="outline" type="submit">
                  Đã đọc
                </Button>
              </form>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdvisorTab({
  summary,
  debts,
  avalanche,
  snowball,
}: {
  summary: ReturnType<typeof calculateCashflow>;
  debts: Parameters<typeof buildAvalanchePlan>[0];
  avalanche: ReturnType<typeof buildAvalanchePlan>;
  snowball: ReturnType<typeof buildSnowballPlan>;
}) {
  const hasOverdue = debts.some((debt) => debt.status === "overdue");
  const recommendation = hasOverdue || summary.net < 0 ? "Khủng hoảng trước" : "Avalanche";

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Snapshot gửi cho AI</CardTitle>
          <CardDescription>API `POST /api/ai-advice` dùng cùng các chỉ số này.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700">
          <InfoRow label="Thu nhập" value={formatVnd(summary.income)} />
          <InfoRow label="Chi tiêu" value={formatVnd(summary.expense)} />
          <InfoRow label="Dòng tiền" value={formatVnd(summary.net)} />
          <InfoRow label="Tổng nợ" value={formatVnd(summary.debtTotal)} />
          <InfoRow label="Ưu tiên" value={recommendation} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>AI Cố vấn</CardTitle>
          <CardDescription>Provider-agnostic adapter, chỉ đề xuất và cảnh báo, không tự sửa dữ liệu.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 text-amber-700" size={18} />
              <div>
                <p className="font-medium text-amber-950">Đề xuất hiện tại: {recommendation}</p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  Nếu có nợ quá hạn hoặc dòng tiền âm, hệ thống ưu tiên thanh toán tối thiểu và giảm phí phạt trước khi tối ưu lãi.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DebtPlan title="Avalanche" description="Tối ưu chi phí lãi" items={avalanche} />
            <DebtPlan title="Snowball" description="Tạo đà tâm lý" items={snowball} />
          </div>
          <form action="/api/ai-advice" method="post">
            <Button type="submit">
              <Brain size={16} /> Gọi AI advisor API
            </Button>
          </form>
          <p className="text-xs leading-5 text-slate-500">Gợi ý từ AI chỉ mang tính tham khảo, không thay thế tư vấn tài chính chuyên nghiệp.</p>
        </CardContent>
      </Card>
    </section>
  );
}

function ImportTab() {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
          <CardDescription>Upload CSV sẽ parse, validate, insert `transactions` và ghi metadata `csv_imports`.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={importTransactionsCsvAction} className="grid gap-3">
            <Input name="csv" type="file" accept=".csv" required />
            <Button type="submit">
              <FileUp size={16} /> Import vào database
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Mẫu CSV</CardTitle>
          <CardDescription>Các dòng lỗi sẽ bị bỏ qua và ghi vào số dòng failed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            value={"date,type,amount,category,account,note\n2026-06-09,expense,120000,Ăn uống,Tiền mặt,Bữa trưa\n2026-06-10,income,3000000,Freelance,Tài khoản chính,Dự án A"}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function TransactionsView({ transactions }: { transactions: Parameters<typeof monthlySeries>[0] }) {
  if (transactions.length === 0) {
    return <EmptyState text="Chưa có giao dịch nào." />;
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {transactions.map((transaction) => (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={transaction.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-950">{transaction.category}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {transaction.date} · {transaction.account}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-950">{formatVnd(transaction.amount)}</p>
            </div>
            <div className="mt-3">
              <Badge variant={transaction.type === "income" ? "success" : "warning"}>
                {transaction.type === "income" ? "Thu nhập" : "Chi tiêu"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === "income" ? "success" : "warning"}>
                    {transaction.type === "income" ? "Thu nhập" : "Chi tiêu"}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <TableCell className="text-right font-medium text-slate-950">{formatVnd(transaction.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function DebtsView({ debts }: { debts: Parameters<typeof buildAvalanchePlan>[0] }) {
  if (debts.length === 0) {
    return <EmptyState text="Chưa có khoản nợ nào." />;
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {debts.map((debt) => (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={debt.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-950">{debt.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Hạn {debt.dueDate} · Lãi {debt.interestRate}%
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-950">{formatVnd(debt.currentBalance)}</p>
            </div>
            <div className="mt-3">
              <DebtStatusBadge status={debt.status} />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên khoản nợ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Lãi suất</TableHead>
              <TableHead>Hạn trả</TableHead>
              <TableHead className="text-right">Số dư</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debts.map((debt) => (
              <TableRow key={debt.id}>
                <TableCell className="font-medium text-slate-950">{debt.name}</TableCell>
                <TableCell>
                  <DebtStatusBadge status={debt.status} />
                </TableCell>
                <TableCell>{debt.interestRate}%</TableCell>
                <TableCell>{debt.dueDate}</TableCell>
                <TableCell className="text-right font-medium text-slate-950">{formatVnd(debt.currentBalance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "teal" | "amber" | "rose" | "indigo";
}) {
  const toneClass = {
    teal: "bg-teal-50 text-teal-800",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
    indigo: "bg-indigo-50 text-indigo-800",
  }[tone];

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className={`rounded-md p-2 ${toneClass}`}>{icon}</div>
          <CalendarClock className="text-slate-300" size={18} />
        </div>
        <p className="mt-4 text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-normal text-slate-950 sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBanner({ mode, error, saved, dataError }: { mode: string; error?: string; saved?: string; dataError?: string }) {
  const modeText = {
    demo: "Demo mode: chưa cấu hình Supabase, form ghi dữ liệu sẽ yêu cầu env và đăng nhập.",
    anonymous: "Supabase đã cấu hình nhưng bạn chưa đăng nhập; app đang hiển thị dữ liệu demo.",
    authenticated: "Backend Supabase đang hoạt động với session hiện tại.",
    error: "Không thể tải dữ liệu thật từ Supabase cho phiên đăng nhập hiện tại.",
  }[mode];

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${mode === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
        <Database size={16} className={mode === "error" ? "text-rose-700" : "text-teal-700"} />
        {modeText}
      </div>
      {saved ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Đã lưu: {saved}</div> : null}
      {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div> : null}
      {dataError ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{dataError}</div> : null}
    </div>
  );
}

function DataErrorState({ message }: { message?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Không thể tải dữ liệu tài chính</CardTitle>
        <CardDescription>
          Phiên đăng nhập đã được nhận diện, nhưng truy vấn Supabase đang lỗi nên hệ thống không hiển thị dữ liệu demo thay thế.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertTriangle className="mt-0.5 shrink-0 text-rose-700" size={18} />
          <p>{message ?? "Vui lòng thử lại sau hoặc kiểm tra cấu hình Supabase."}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeMonthParam(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? new Date().getFullYear().toString();
  const currentMonth = parts.find((part) => part.type === "month")?.value ?? String(new Date().getMonth() + 1).padStart(2, "0");

  return `${year}-${currentMonth}`;
}

function DebtStatusBadge({ status }: { status: string }) {
  if (status === "overdue") return <Badge variant="danger">Quá hạn</Badge>;
  if (status === "due_soon") return <Badge variant="warning">Sắp đến hạn</Badge>;
  if (status === "paid") return <Badge variant="success">Đã trả</Badge>;
  return <Badge variant="info">Đang trả</Badge>;
}

function DebtPlan({ title, description, items }: { title: string; description: string; items: ReturnType<typeof buildAvalanchePlan> }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
      <div className="mt-4 grid gap-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">Không có khoản nợ đang mở.</p> : null}
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3" key={item.debtId}>
            <div>
              <p className="text-sm font-medium text-slate-950">
                #{item.rank} {item.name}
              </p>
              <p className="text-xs text-slate-500">Lãi {item.interestRate}%</p>
            </div>
            <p className="text-sm font-semibold text-slate-950">{formatVnd(item.currentBalance)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <Input name={name} placeholder={placeholder} step={step} type={type} required={name !== "note"} />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <span>{label}</span>
      <span className="font-medium text-slate-950">{value}</span>
    </div>
  );
}

function CompactList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {items.length === 0 ? <EmptyState text="Chưa có dữ liệu." /> : null}
        {items.map((item) => (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700" key={item}>
            {item}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}
