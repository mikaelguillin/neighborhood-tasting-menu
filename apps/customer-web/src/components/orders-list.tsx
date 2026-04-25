"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderItem = {
  id: string;
  planName: string;
  status: string;
  totalCents: number;
  createdAt: string;
};

function centsToMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

export function OrdersList() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/orders", { signal: controller.signal });
        if (!response.ok) return;
        const payload = (await response.json()) as { items: OrderItem[] };
        setItems(payload.items);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-foreground/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading orders...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-[12px] bg-card p-7 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold tracking-tight text-brand">No orders yet</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Place your first order to unlock a full lifecycle timeline.
        </p>
        <Button className="mt-5" asChild>
          <Link href="/checkout">Start checkout</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {items.map((order) => (
        <article
          key={order.id}
          className="rounded-[12px] bg-card p-5 shadow-[var(--shadow-card)] md:flex md:items-center md:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {order.id}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-brand">{order.planName}</h2>
            <p className="mt-1 text-sm text-foreground/70">
              {new Date(order.createdAt).toLocaleString()} - {order.status.replaceAll("_", " ")}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3 md:mt-0">
            <p className="text-base font-semibold">{centsToMoney(order.totalCents)}</p>
            <Button variant="outline" asChild>
              <Link href={`/orders/${order.id}`}>
                Timeline <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
