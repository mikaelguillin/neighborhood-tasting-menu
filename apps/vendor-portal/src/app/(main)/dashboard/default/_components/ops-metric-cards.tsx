"use client";

import { AlertTriangle, Clock3, ListOrdered, PackageSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventoryItem, QueueOrder } from "@/lib/vendor-ops-store";

export function OpsMetricCards({
  queue,
  inventory,
}: {
  queue: QueueOrder[];
  inventory: InventoryItem[];
}) {
  const activeQueue = queue.filter((item) => item.status !== "fulfilled").length;
  const urgentQueue = queue.filter((item) => item.slaMinutesRemaining <= 30 && item.status !== "fulfilled").length;
  const lowStock = inventory.filter((item) => item.stock <= item.lowStockThreshold).length;
  const unavailable = inventory.filter((item) => !item.available).length;

  const cards = [
    { title: "Active Queue", value: activeQueue, icon: ListOrdered, helper: "Orders requiring action now" },
    { title: "Urgent SLA", value: urgentQueue, icon: Clock3, helper: "Orders due in <= 30 minutes" },
    { title: "Low Stock", value: lowStock, icon: AlertTriangle, helper: "Items under threshold" },
    { title: "Unavailable", value: unavailable, icon: PackageSearch, helper: "Items hidden from ordering" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="font-medium text-sm">{card.title}</CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-2xl tabular-nums">{card.value}</div>
            <p className="mt-1 text-muted-foreground text-xs">{card.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
