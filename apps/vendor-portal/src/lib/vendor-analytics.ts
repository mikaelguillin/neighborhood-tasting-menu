import { createSupabaseServerClient } from "@/lib/supabase-server";

export type VendorAnalyticsDaySales = {
  day: string;
  order_count: number;
  gmv_cents: number;
};

export type VendorAnalyticsDayFulfillments = {
  day: string;
  fulfilled_count: number;
};

export type VendorAnalyticsNeighborhoodSales = {
  neighborhood: string;
  order_count: number;
  gmv_cents: number;
};

export type VendorAnalyticsDayCustomers = {
  day: string;
  new_customers: number;
  returning_customers: number;
};

export type VendorAnalyticsDashboard = {
  period: {
    orders_count: number;
    gmv_cents: number;
    cancelled_orders_count: number;
    fulfilled_tasks_count: number;
    open_workload_count: number;
  };
  previous: {
    orders_count: number;
    gmv_cents: number;
  };
  sales_by_day: VendorAnalyticsDaySales[];
  fulfillments_by_day: VendorAnalyticsDayFulfillments[];
  sales_by_neighborhood: VendorAnalyticsNeighborhoodSales[];
  customers_by_day: VendorAnalyticsDayCustomers[];
};

function asNonNegativeInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function parseSalesDay(row: unknown): VendorAnalyticsDaySales | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const day = o.day;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return {
    day,
    order_count: asNonNegativeInt(o.order_count),
    gmv_cents: asNonNegativeInt(o.gmv_cents),
  };
}

function parseFulfillmentDay(row: unknown): VendorAnalyticsDayFulfillments | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const day = o.day;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return {
    day,
    fulfilled_count: asNonNegativeInt(o.fulfilled_count),
  };
}

function parseNeighborhoodSales(row: unknown): VendorAnalyticsNeighborhoodSales | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const neighborhood = o.neighborhood;
  if (typeof neighborhood !== "string" || neighborhood.trim().length === 0) return null;
  return {
    neighborhood: neighborhood.trim(),
    order_count: asNonNegativeInt(o.order_count),
    gmv_cents: asNonNegativeInt(o.gmv_cents),
  };
}

function parseCustomersDay(row: unknown): VendorAnalyticsDayCustomers | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const day = o.day;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return {
    day,
    new_customers: asNonNegativeInt(o.new_customers),
    returning_customers: asNonNegativeInt(o.returning_customers),
  };
}

export function parseVendorAnalyticsDashboard(raw: unknown): VendorAnalyticsDashboard | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const period = root.period;
  const previous = root.previous;
  if (!period || typeof period !== "object" || !previous || typeof previous !== "object") {
    return null;
  }
  const p = period as Record<string, unknown>;
  const prev = previous as Record<string, unknown>;

  const salesRaw = root.sales_by_day;
  const fulfillRaw = root.fulfillments_by_day;
  const neighborhoodSalesRaw = root.sales_by_neighborhood;
  const customersRaw = root.customers_by_day;
  const sales_by_day = Array.isArray(salesRaw)
    ? salesRaw.map(parseSalesDay).filter((x): x is VendorAnalyticsDaySales => x !== null)
    : [];
  const fulfillments_by_day = Array.isArray(fulfillRaw)
    ? fulfillRaw.map(parseFulfillmentDay).filter((x): x is VendorAnalyticsDayFulfillments => x !== null)
    : [];
  const sales_by_neighborhood = Array.isArray(neighborhoodSalesRaw)
    ? neighborhoodSalesRaw
        .map(parseNeighborhoodSales)
        .filter((x): x is VendorAnalyticsNeighborhoodSales => x !== null)
    : [];
  const customers_by_day = Array.isArray(customersRaw)
    ? customersRaw.map(parseCustomersDay).filter((x): x is VendorAnalyticsDayCustomers => x !== null)
    : [];

  return {
    period: {
      orders_count: asNonNegativeInt(p.orders_count),
      gmv_cents: asNonNegativeInt(p.gmv_cents),
      cancelled_orders_count: asNonNegativeInt(p.cancelled_orders_count),
      fulfilled_tasks_count: asNonNegativeInt(p.fulfilled_tasks_count),
      open_workload_count: asNonNegativeInt(p.open_workload_count),
    },
    previous: {
      orders_count: asNonNegativeInt(prev.orders_count),
      gmv_cents: asNonNegativeInt(prev.gmv_cents),
    },
    sales_by_day,
    fulfillments_by_day,
    sales_by_neighborhood,
    customers_by_day,
  };
}

export async function fetchVendorAnalyticsDashboard(
  vendorId: string,
  range: { from: Date; to: Date },
): Promise<{ data: VendorAnalyticsDashboard | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: raw, error } = await supabase.rpc("get_vendor_analytics_dashboard", {
    v_vendor_id: vendorId,
    v_from: range.from.toISOString(),
    v_to: range.to.toISOString(),
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const parsed = parseVendorAnalyticsDashboard(raw);
  if (!parsed) {
    return { data: null, error: "Invalid analytics payload" };
  }

  return { data: parsed, error: null };
}
