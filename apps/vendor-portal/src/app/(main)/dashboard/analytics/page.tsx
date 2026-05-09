import { redirect } from "next/navigation";

import { requireVendorMembership } from "@/lib/supabase-server";
import { fetchVendorAnalyticsDashboard } from "@/lib/vendor-analytics";
import {
  buildFulfillmentChartSeries,
  buildSalesChartSeries,
  resolveAnalyticsRangeFromSearchParams,
  ymdUtcFromDate,
} from "@/lib/vendor-analytics-range";

import { VendorAnalyticsDashboard } from "./_components/vendor-analytics-dashboard";

export default async function Page({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ from?: string; to?: string }>;
}>) {
  const membership = await requireVendorMembership();
  if ("error" in membership) {
    redirect("/auth/v1/login");
  }

  const sp = await searchParams;
  const range = resolveAnalyticsRangeFromSearchParams({ from: sp.from, to: sp.to });
  const { data, error } = await fetchVendorAnalyticsDashboard(membership.vendorId, range);

  const fallback = {
    period: {
      orders_count: 0,
      gmv_cents: 0,
      cancelled_orders_count: 0,
      fulfilled_tasks_count: 0,
      open_workload_count: 0,
    },
    previous: { orders_count: 0, gmv_cents: 0 },
    sales_by_day: [] as const,
    fulfillments_by_day: [] as const,
  };

  const d = data ?? fallback;
  const salesSeries = buildSalesChartSeries(range.from, range.to, [...d.sales_by_day]);
  const fulfillmentSeries = buildFulfillmentChartSeries(range.from, range.to, [...d.fulfillments_by_day]);

  return (
    <VendorAnalyticsDashboard
      period={d.period}
      previous={d.previous}
      salesSeries={salesSeries}
      fulfillmentSeries={fulfillmentSeries}
      rangeFromYmd={ymdUtcFromDate(range.from)}
      rangeToYmd={ymdUtcFromDate(range.to)}
      loadError={error}
    />
  );
}
