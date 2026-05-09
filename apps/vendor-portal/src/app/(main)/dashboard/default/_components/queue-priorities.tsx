"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERABLE_QUEUE_STATUSES } from "@/lib/vendor-ops-types";
import type { OperableQueueStatus, QueueOrder, QueueStatus } from "@/lib/vendor-ops-types";

const ORDER_STATUS_BADGE_STYLES: Record<QueueStatus, string> = {
  new: "border-rose-200 bg-rose-100 text-rose-900",
  confirmed: "border-blue-200 bg-blue-100 text-blue-900",
  preparing: "border-amber-200 bg-amber-100 text-amber-900",
  ready: "border-emerald-200 bg-emerald-100 text-emerald-900",
  fulfilled: "border-slate-300 bg-slate-100 text-slate-800",
  cancelled: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

function statusBadgeClassName(status: QueueStatus): string {
  return ORDER_STATUS_BADGE_STYLES[status];
}

export function QueuePriorities({
  queue,
  onQueueChange,
}: {
  queue: QueueOrder[];
  onQueueChange: () => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);

  function sourceLabel(item: QueueOrder) {
    if (!item.sourceType || !item.sourceLabel) return null;
    return `${item.sourceType === "plan" ? "Plan" : "Neighborhood"}: ${item.sourceLabel}`;
  }

  async function updateStatus(id: string, status: OperableQueueStatus) {
    setSavingId(id);
    await fetch(`/api/vendor/ops/queue/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await onQueueChange();
    setSavingId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live queue priorities</CardTitle>
        <CardDescription>
          Prioritize by SLA and move orders through preparation with explicit status transitions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border p-3 md:flex md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{item.orderId}</p>
                <Badge variant="outline" className={statusBadgeClassName(item.status)}>
                  {item.status.replaceAll("_", " ")}
                </Badge>
                <Badge variant={item.priority === "high" ? "destructive" : "outline"}>
                  {item.priority} priority
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Queue item {item.id}
              </p>
              {sourceLabel(item) ? (
                <p className="text-muted-foreground text-xs">{sourceLabel(item)}</p>
              ) : null}
              <p className="text-muted-foreground text-xs">
                Due {new Date(item.dueAt).toLocaleTimeString()} ({item.slaMinutesRemaining} min SLA)
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 md:mt-0">
              {item.status === "cancelled" ? (
                <p className="text-muted-foreground text-xs">Order cancelled — no status changes</p>
              ) : (
                <>
                  <Select
                    value={item.status}
                    onValueChange={(value: OperableQueueStatus) => updateStatus(item.id, value)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERABLE_QUEUE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    disabled={savingId === item.id}
                    onClick={() => updateStatus(item.id, item.status as OperableQueueStatus)}
                  >
                    {savingId === item.id ? "Saving..." : "Sync"}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
