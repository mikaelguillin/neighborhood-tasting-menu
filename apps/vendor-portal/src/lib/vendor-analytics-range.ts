/** UTC start of calendar day for `yyyy-MM-dd`. */
export function utcStartOfDayFromYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/** UTC end of calendar day for `yyyy-MM-dd` (inclusive ordering queries). */
export function utcEndOfDayFromYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

export function defaultAnalyticsRangeUtc(): { from: Date; to: Date } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth();
  const d = now.getUTCDate();
  const to = new Date(Date.UTC(y, mo, d, 23, 59, 59, 999));
  const startCal = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
  startCal.setUTCDate(startCal.getUTCDate() - 29);
  const from = new Date(Date.UTC(startCal.getUTCFullYear(), startCal.getUTCMonth(), startCal.getUTCDate(), 0, 0, 0, 0));
  return { from, to };
}

export function resolveAnalyticsRangeFromSearchParams(params: { from?: string; to?: string }): {
  from: Date;
  to: Date;
} {
  const fallback = defaultAnalyticsRangeUtc();
  const fromRaw = params.from?.trim();
  const toRaw = params.to?.trim();
  if (!fromRaw || !toRaw) {
    return fallback;
  }
  const from = utcStartOfDayFromYmd(fromRaw);
  const to = utcEndOfDayFromYmd(toRaw);
  if (!from || !to || from.getTime() > to.getTime()) {
    return fallback;
  }
  return { from, to };
}

export type SalesChartPoint = {
  dayKey: string;
  label: string;
  order_count: number;
  gmv_cents: number;
};

export type FulfillmentChartPoint = {
  dayKey: string;
  label: string;
  fulfilled_count: number;
};

export function buildSalesChartSeries(
  from: Date,
  to: Date,
  rows: Array<{ day: string; order_count: number; gmv_cents: number }>,
): SalesChartPoint[] {
  const map = new Map(rows.map((r) => [r.day, r] as const));
  const days = eachUtcCalendarDayInclusive(from, to);
  return days.map((day) => {
    const dayKey = ymdUtcFromDate(day);
    const row = map.get(dayKey);
    return {
      dayKey,
      label: formatChartLabelUtc(day),
      order_count: row?.order_count ?? 0,
      gmv_cents: row?.gmv_cents ?? 0,
    };
  });
}

export function buildFulfillmentChartSeries(
  from: Date,
  to: Date,
  rows: Array<{ day: string; fulfilled_count: number }>,
): FulfillmentChartPoint[] {
  const map = new Map(rows.map((r) => [r.day, r] as const));
  const days = eachUtcCalendarDayInclusive(from, to);
  return days.map((day) => {
    const dayKey = ymdUtcFromDate(day);
    const row = map.get(dayKey);
    return {
      dayKey,
      label: formatChartLabelUtc(day),
      fulfilled_count: row?.fulfilled_count ?? 0,
    };
  });
}

export function ymdUtcFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eachUtcCalendarDayInclusive(from: Date, to: Date): Date[] {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  const days: Date[] = [];
  for (let t = start; t <= end; t += 86_400_000) {
    days.push(new Date(t));
  }
  return days;
}

function formatChartLabelUtc(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

/** Parses `yyyy-MM-dd` as a local calendar day for the range picker. */
export function localCalendarDateFromYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}
