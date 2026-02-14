"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OrdersByStatusRow = { status: string; count: number };
type RevenuePoint = { date: string; revenue: number };

type Props = {
  revenueLast30Days: RevenuePoint[];
  ordersByStatus: OrdersByStatusRow[];
};

function formatShortDate(value: string) {
  const [y, m, d] = value.split("-").map((v) => Number(v));
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function AnalyticsCharts({ revenueLast30Days, ordersByStatus }: Props) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-medium text-heading">Revenue (Last 30 Days)</div>
          <div className="text-[13px] text-muted">Paid orders only</div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueLast30Days} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} interval={4} tick={{ fontSize: 12, fill: "#6B6560" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B6560" }} />
              <Tooltip formatter={(value: unknown) => [Number(value).toFixed(2), "Revenue"]} labelFormatter={(label: unknown) => String(label)} />
              <Line type="monotone" dataKey="revenue" stroke="#C6A756" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-medium text-heading">Orders by Status</div>
          <div className="text-[13px] text-muted">All orders</div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersByStatus} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="status" tick={{ fontSize: 12, fill: "#6B6560" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B6560" }} allowDecimals={false} />
              <Tooltip formatter={(value: unknown) => [Number(value), "Orders"]} labelFormatter={(label: unknown) => String(label)} />
              <Bar dataKey="count" fill="#1C1A18" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
