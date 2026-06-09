"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatVnd } from "@/lib/utils";

const colors = ["#0f766e", "#b45309", "#4f46e5", "#be123c", "#0369a1", "#15803d"];

export function MonthlyCashflowChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${Number(value) / 1_000_000}tr`} />
          <Tooltip formatter={(value) => formatVnd(Number(value))} />
          <Bar dataKey="income" name="Thu nhập" fill="#0f766e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Chi tiêu" fill="#b45309" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryExpenseChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatVnd(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
