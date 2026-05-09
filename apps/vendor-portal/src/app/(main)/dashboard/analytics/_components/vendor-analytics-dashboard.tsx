"use client";

import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { Info } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { DateRangePicker } from "@/components/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLegend, ChartLegendContent, type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import type { CustomerMixChartPoint, FulfillmentChartPoint, SalesChartPoint } from "@/lib/vendor-analytics-range";
import { localCalendarDateFromYmd } from "@/lib/vendor-analytics-range";

type PeriodSnapshot = {
  orders_count: number;
  gmv_cents: number;
  cancelled_orders_count: number;
  fulfilled_tasks_count: number;
  open_workload_count: number;
};

type PreviousSnapshot = {
  orders_count: number;
  gmv_cents: number;
};

type NeighborhoodSalesPoint = {
  neighborhood: string;
  order_count: number;
  gmv_cents: number;
};

export type VendorAnalyticsDashboardProps = {
  period: PeriodSnapshot;
  previous: PreviousSnapshot;
  salesSeries: SalesChartPoint[];
  fulfillmentSeries: FulfillmentChartPoint[];
  neighborhoodSales: NeighborhoodSalesPoint[];
  customerMixSeries: CustomerMixChartPoint[];
  rangeFromYmd: string;
  rangeToYmd: string;
  loadError: string | null;
};

const salesChartConfig = {
  gmv_cents: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const fulfillmentChartConfig = {
  fulfilled_count: {
    label: "Fulfilled",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const neighborhoodSalesChartConfig = {
  gmv_cents: {
    label: "Revenue",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const customerMixChartConfig = {
  new_customers: {
    label: "New customers",
    color: "var(--chart-4)",
  },
  returning_customers: {
    label: "Returning customers",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function formatPctDelta(current: number, previous: number): string | null {
  if (previous <= 0) {
    return current > 0 ? "New" : null;
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export function VendorAnalyticsDashboard({
  period,
  previous,
  salesSeries,
  fulfillmentSeries,
  neighborhoodSales,
  customerMixSeries,
  rangeFromYmd,
  rangeToYmd,
  loadError,
}: VendorAnalyticsDashboardProps) {
  const router = useRouter();
  const fromDate = localCalendarDateFromYmd(rangeFromYmd);
  const toDate = localCalendarDateFromYmd(rangeToYmd);
  const pickerValue: DateRange | undefined = fromDate && toDate ? { from: fromDate, to: toDate } : undefined;

  const handleRangeChange = (value: DateRange | undefined) => {
    if (!value?.from || !value?.to) return;
    const from = format(value.from, "yyyy-MM-dd");
    const to = format(value.to, "yyyy-MM-dd");
    router.push(`/dashboard/analytics?from=${from}&to=${to}`);
  };

  const aovCents = period.orders_count > 0 ? Math.round(period.gmv_cents / period.orders_count) : 0;

  const ordersDelta = formatPctDelta(period.orders_count, previous.orders_count);
  const gmvDelta = formatPctDelta(period.gmv_cents, previous.gmv_cents);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <section className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Sales and fulfillment for orders you were assigned to. Dollar amounts reflect full checkout totals, not vendor
          payout splits.
        </p>
      </section>

      {loadError ? (
        <Card className="border-destructive/50 shadow-xs">
          <CardHeader>
            <CardTitle className="text-destructive">Could not load analytics</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <DateRangePicker value={pickerValue} onChange={handleRangeChange} />
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Orders"
            value={String(period.orders_count)}
            delta={ordersDelta}
            footnote="Non-cancelled, distinct customer orders in range"
          />
          <KpiCard
            label="Sales (GMV)"
            value={formatCurrency(period.gmv_cents / 100, { noDecimals: true })}
            delta={gmvDelta}
            footnote="Sum of checkout totals for those orders"
            infoTooltip="Each figure is the customer’s full order total. When several vendors share one order, totals are not split per vendor."
          />
          <KpiCard
            label="Avg order value"
            value={formatCurrency(aovCents / 100, { noDecimals: true })}
            footnote="GMV ÷ orders"
          />
          <KpiCard
            label="Cancelled orders"
            value={String(period.cancelled_orders_count)}
            footnote="Distinct orders with cancelled status"
          />
          <KpiCard
            label="Fulfilled tasks"
            value={String(period.fulfilled_tasks_count)}
            footnote="Queue rows marked fulfilled in range"
          />
          <KpiCard
            label="Open workload"
            value={String(period.open_workload_count)}
            footnote="New through ready (now)"
          />
        </div>
      </TooltipProvider>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Revenue over time</CardTitle>
            <CardDescription>Daily GMV from non-cancelled orders by customer order date (UTC)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={salesChartConfig} className="h-64 w-full">
              <LineChart data={salesSeries} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.25} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                <YAxis
                  tickFormatter={(value: number) => `$${Math.round(value / 100)}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={44}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line
                  dataKey="gmv_cents"
                  type="monotone"
                  stroke="var(--color-gmv_cents)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Fulfillments per day</CardTitle>
            <CardDescription>Queue items marked fulfilled by update date (UTC)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={fulfillmentChartConfig} className="h-64 w-full">
              <BarChart data={fulfillmentSeries} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.25} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="fulfilled_count"
                  fill="var(--color-fulfilled_count)"
                  fillOpacity={0.35}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Sales by neighborhood</CardTitle>
            <CardDescription>Revenue by neighborhood for non-cancelled orders in range</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={neighborhoodSalesChartConfig} className="h-64 w-full">
              <BarChart data={neighborhoodSales} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.25} />
                <XAxis type="number" tickFormatter={(value: number) => `$${Math.round(value / 100)}`} />
                <YAxis type="category" dataKey="neighborhood" tickLine={false} axisLine={false} width={110} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="gmv_cents" fill="var(--color-gmv_cents)" fillOpacity={0.45} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>New vs returning customers</CardTitle>
            <CardDescription>Distinct customers per day, split by first-time vs repeat</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={customerMixChartConfig} className="h-64 w-full">
              <BarChart data={customerMixSeries} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.25} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="new_customers"
                  stackId="customers"
                  fill="var(--color-new_customers)"
                  fillOpacity={0.6}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="returning_customers"
                  stackId="customers"
                  fill="var(--color-returning_customers)"
                  fillOpacity={0.45}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  footnote,
  infoTooltip,
}: {
  label: string;
  value: string;
  delta?: string | null;
  footnote: string;
  infoTooltip?: string;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center gap-1.5">
          <CardDescription className="font-medium text-xs">{label}</CardDescription>
          {infoTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`About ${label}`}
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-snug">{infoTooltip}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="font-semibold text-xl tabular-nums tracking-tight">{value}</div>
        {delta ? (
          <Badge variant="secondary" className="w-fit tabular-nums">
            vs prior {delta}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-[11px] text-muted-foreground leading-snug">{footnote}</p>
      </CardContent>
    </Card>
  );
}
