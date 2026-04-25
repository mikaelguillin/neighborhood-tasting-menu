"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TimelineEvent = {
  status: string;
  label: string;
  timestamp: string;
  note: string;
};

type OrderDetail = {
  id: string;
  planName: string;
  status: string;
  address: string;
  deliveryWindow: string;
  totalCents: number;
  timeline: TimelineEvent[];
};

function centsToMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

export function OrderTimeline({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? "Order not found" : "Could not load order");
      }
      const payload = (await response.json()) as OrderDetail;
      setOrder(payload);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load order";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function advanceStatus() {
    setAdvancing(true);
    await fetch(`/api/orders/${orderId}/advance`, { method: "POST" });
    await load();
    setAdvancing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading order timeline...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-[12px] bg-card p-7 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold tracking-tight text-brand">Order unavailable</h1>
        <p className="mt-2 text-sm text-foreground/70">{error ?? "No order found for this id."}</p>
        <Button className="mt-5" variant="outline" asChild>
          <Link href="/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const isComplete = order.status === "delivered";

  return (
    <div className="space-y-6">
      <div className="rounded-[12px] bg-card p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{order.id}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand">{order.planName}</h1>
        <p className="mt-2 text-sm text-foreground/70">
          {order.address} - {order.deliveryWindow}
        </p>
        <p className="mt-3 text-base font-semibold">{centsToMoney(order.totalCents)}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={advanceStatus} disabled={isComplete || advancing}>
            {advancing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : isComplete ? (
              "Delivered"
            ) : (
              "Advance status"
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/orders">All orders</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-[12px] bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-semibold tracking-tight text-brand">Timeline</h2>
        <ol className="mt-5 space-y-5">
          {order.timeline.map((event, index) => {
            const isLast = index === order.timeline.length - 1;
            return (
              <li key={`${event.status}-${event.timestamp}`} className="relative flex gap-3">
                <div className="mt-0.5">
                  {isLast ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-semibold text-foreground">{event.label}</p>
                  <p className="mt-0.5 text-xs text-foreground/60">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-foreground/75">{event.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
