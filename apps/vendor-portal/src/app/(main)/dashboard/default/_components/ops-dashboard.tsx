"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { OpsMetricCards } from "./ops-metric-cards";
import { QueuePriorities } from "./queue-priorities";
import type { InventoryItem, QueueOrder } from "@/lib/vendor-ops-store";

export function OpsDashboard() {
  const [queue, setQueue] = useState<QueueOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    const response = await fetch("/api/vendor/ops/queue");
    if (!response.ok) return;
    const payload = (await response.json()) as { items: QueueOrder[] };
    setQueue(payload.items);
  }, []);

  const loadInventory = useCallback(async () => {
    const response = await fetch("/api/vendor/ops/inventory");
    if (!response.ok) return;
    const payload = (await response.json()) as { items: InventoryItem[] };
    setInventory(payload.items);
  }, []);

  useEffect(() => {
    async function load() {
      await Promise.all([loadQueue(), loadInventory()]);
      setLoading(false);
    }

    load();
  }, [loadInventory, loadQueue]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading operations dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <OpsMetricCards queue={queue} inventory={inventory} />
      <QueuePriorities queue={queue} onQueueChange={loadQueue} />
    </div>
  );
}
