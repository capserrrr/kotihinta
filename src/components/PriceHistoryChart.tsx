"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/lib/statfin";
import { useDictionary } from "@/lib/LanguageContext";

function formatPeriodLabel(period: string): string {
  if (period.includes("Q")) {
    const [year, q] = period.split("Q");
    return `${q}/${year.slice(2)}`;
  }
  return period;
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Zoom the axis to the visible data instead of always starting at 0, so
// short/flat-looking ranges still show real movement.
function niceDomain(values: number[]): [(dataMin: number) => number, (dataMax: number) => number] {
  const span = Math.max(...values) - Math.min(...values);
  const pad = Math.max(span * 0.15, Math.max(...values) * 0.02);
  return [
    (dataMin: number) => Math.max(0, Math.floor((dataMin - pad) / 50) * 50),
    (dataMax: number) => Math.ceil((dataMax + pad) / 50) * 50,
  ];
}

interface Props {
  series: PricePoint[];
  valueLabel: string;
  valueSuffix: string;
}

export default function PriceHistoryChart({ series, valueLabel, valueSuffix }: Props) {
  const dict = useDictionary();
  const data = series
    .filter((p) => p.pricePerM2 !== null)
    .map((p) => ({
      period: p.period,
      label: formatPeriodLabel(p.period),
      price: p.pricePerM2 as number,
      count: p.transactionCount,
    }));

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        {dict.chart.noData}
      </div>
    );
  }

  const domain = niceDomain(data.map((d) => d.price));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={domain}
            tickFormatter={(v) => `${Math.round(v / 100) / 10}k`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
            formatter={(value, _name, item) => {
              const count = (item?.payload as { count?: number } | undefined)?.count;
              return [
                `${formatEur(Number(value))}${valueSuffix}${count ? ` · ${count} ${dict.chart.salesWord}` : ""}`,
                valueLabel,
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={{ r: 3, stroke: "var(--accent)", strokeWidth: 2, fill: "var(--background)" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
