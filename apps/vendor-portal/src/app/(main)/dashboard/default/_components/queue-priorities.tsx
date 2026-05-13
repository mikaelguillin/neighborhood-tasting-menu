"use client";

import { useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatQueueDueRelative } from "@/lib/format-queue-due";
import type { OperableQueueStatus, QueueOrder, QueueStatus } from "@/lib/vendor-ops-types";
import { OPERABLE_QUEUE_STATUSES } from "@/lib/vendor-ops-types";

const PAGE_SIZE = 10;

const FILTER_ALL = "__all__" as const;

type DueAtSort = "asc" | "desc";

function sourceKey(item: QueueOrder): string | null {
  const raw = item.sourceSlug ?? item.sourceLabel;
  return raw && raw.length > 0 ? raw : null;
}

function passesNeighborhoodFilter(item: QueueOrder, filter: string): boolean {
  if (filter === FILTER_ALL) return true;
  if (item.sourceType !== "neighborhood") return false;
  return sourceKey(item) === filter;
}

function passesPlanFilter(item: QueueOrder, filter: string): boolean {
  if (filter === FILTER_ALL) return true;
  if (item.sourceType !== "plan") return false;
  return sourceKey(item) === filter;
}

function compareQueueByDueAt(a: QueueOrder, b: QueueOrder, direction: DueAtSort): number {
  const tA = new Date(a.dueAt).getTime();
  const tB = new Date(b.dueAt).getTime();
  const delta = tA - tB;
  if (delta !== 0) {
    return direction === "asc" ? delta : -delta;
  }
  return direction === "asc" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
}

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

function sourceTypeDisplay(sourceType: QueueOrder["sourceType"]): string {
  if (sourceType === "plan") return "Plan";
  if (sourceType === "neighborhood") return "Neighborhood";
  return "—";
}

export function QueuePriorities({ queue, onQueueChange }: { queue: QueueOrder[]; onQueueChange: () => Promise<void> }) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<QueueOrder | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [dueAtSort, setDueAtSort] = useState<DueAtSort>("desc");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>(FILTER_ALL);
  const [planFilter, setPlanFilter] = useState<string>(FILTER_ALL);

  const neighborhoodOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of queue) {
      if (item.sourceType !== "neighborhood") continue;
      const key = sourceKey(item);
      if (!key) continue;
      const label = item.sourceLabel ?? key;
      map.set(key, label);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [queue]);

  const planOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of queue) {
      if (item.sourceType !== "plan") continue;
      const key = sourceKey(item);
      if (!key) continue;
      const label = item.sourceLabel ?? key;
      map.set(key, label);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [queue]);

  useEffect(() => {
    const valid = new Set(neighborhoodOptions.map(([k]) => k));
    if (neighborhoodFilter !== FILTER_ALL && !valid.has(neighborhoodFilter)) {
      setNeighborhoodFilter(FILTER_ALL);
    }
  }, [neighborhoodFilter, neighborhoodOptions]);

  useEffect(() => {
    const valid = new Set(planOptions.map(([k]) => k));
    if (planFilter !== FILTER_ALL && !valid.has(planFilter)) {
      setPlanFilter(FILTER_ALL);
    }
  }, [planFilter, planOptions]);

  const filteredQueue = useMemo(
    () =>
      queue.filter((item) => passesNeighborhoodFilter(item, neighborhoodFilter) && passesPlanFilter(item, planFilter)),
    [queue, neighborhoodFilter, planFilter],
  );

  const sortedQueue = useMemo(() => {
    if (filteredQueue.length === 0) return [];
    return [...filteredQueue].sort((a, b) => compareQueueByDueAt(a, b, dueAtSort));
  }, [filteredQueue, dueAtSort]);

  const pageCount = sortedQueue.length === 0 ? 0 : Math.ceil(sortedQueue.length / PAGE_SIZE);
  const maxPageIndex = Math.max(0, pageCount - 1);
  const safePageIndex = Math.min(pageIndex, maxPageIndex);
  const pageStart = safePageIndex * PAGE_SIZE;
  const pageItems = sortedQueue.slice(pageStart, pageStart + PAGE_SIZE);
  const currentPage = safePageIndex + 1;

  useEffect(() => {
    setPageIndex((previous) => Math.min(previous, maxPageIndex));
  }, [maxPageIndex]);

  useEffect(() => {
    setPageIndex(0);
  }, [dueAtSort, neighborhoodFilter, planFilter]);

  const canPreviousPage = safePageIndex > 0;
  const canNextPage = safePageIndex < maxPageIndex;

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

  const detail = selectedOrder;
  const detailDueRel =
    detail && detail.status !== "fulfilled" && detail.status !== "cancelled"
      ? formatQueueDueRelative(detail.dueAt, new Date())
      : null;

  return (
    <Card>
      <Dialog open={detail !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>Order details</DialogTitle>
                <DialogDescription className="sr-only">
                  Order identifier, customer, delivery address, timestamps, status, priority, SLA, and ordered plan or
                  product.
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 text-sm">
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Order ID</dt>
                  <dd>{detail.orderId}</dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd>{detail.customerName ?? "—"}</dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Delivery address</dt>
                  <dd className="wrap-break-word">{detail.customerAddress ?? "—"}</dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>
                    {new Date(detail.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Due</dt>
                  <dd>
                    <span className="block">
                      {new Date(detail.dueAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    {detailDueRel ? (
                      <span
                        className={
                          detailDueRel.overdue ? "text-destructive text-xs" : "text-muted-foreground text-xs"
                        }
                      >
                        {detailDueRel.label}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant="outline" className={statusBadgeClassName(detail.status)}>
                      {detail.status.replaceAll("_", " ")}
                    </Badge>
                  </dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Priority</dt>
                  <dd>
                    <Badge variant={detail.priority === "high" ? "destructive" : "outline"}>{detail.priority}</Badge>
                  </dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">SLA (minutes remaining)</dt>
                  <dd>{detail.slaMinutesRemaining}</dd>
                </div>
                <div className="grid gap-0.5">
                  <dt className="text-muted-foreground">Ordered Plan/Product</dt>
                  <dd className="wrap-break-word">{detail.sourceLabel ?? "—"}</dd>
                </div>
              </dl>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <CardHeader>
        <CardTitle>Live queue priorities</CardTitle>
        <CardDescription>
          Prioritize by SLA and move orders through preparation with explicit status transitions.
        </CardDescription>
        {queue.length > 0 ? (
          <CardAction>
            <div className="flex max-w-full flex-col gap-3 @[480px]/card-header:flex-row @[480px]/card-header:flex-wrap @[480px]/card-header:justify-end">
              {neighborhoodOptions.length > 0 ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-muted-foreground text-xs">Neighborhood</span>
                  <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                    <SelectTrigger
                      className="h-8 w-[11.5rem] max-w-[min(100vw-3rem,11.5rem)]"
                      aria-label="Filter queue by neighborhood"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value={FILTER_ALL}>All neighborhoods</SelectItem>
                      {neighborhoodOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {planOptions.length > 0 ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-muted-foreground text-xs">Plan</span>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger
                      className="h-8 w-[11.5rem] max-w-[min(100vw-3rem,11.5rem)]"
                      aria-label="Filter queue by plan"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value={FILTER_ALL}>All plans</SelectItem>
                      {planOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex flex-col items-end gap-1">
                <span className="text-muted-foreground text-xs">Due time</span>
                <Select value={dueAtSort} onValueChange={(value: DueAtSort) => setDueAtSort(value)}>
                  <SelectTrigger
                    className="h-8 w-[11.5rem] max-w-[min(100vw-3rem,11.5rem)]"
                    aria-label="Sort queue by due time"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="asc">Earliest due first</SelectItem>
                    <SelectItem value="desc">Latest due first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {queue.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders in the queue.</p>
        ) : sortedQueue.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No orders match the selected filters. Try choosing &quot;All neighborhoods&quot; or &quot;All plans&quot;.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden whitespace-nowrap sm:table-cell">Created at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="whitespace-nowrap">Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((item) => {
                  const dueRel =
                    item.status === "fulfilled" || item.status === "cancelled"
                      ? null
                      : formatQueueDueRelative(item.dueAt, new Date());
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[12rem]">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto min-w-0 max-w-full justify-start whitespace-normal p-0 font-medium line-clamp-2 text-left"
                          onClick={() => setSelectedOrder(item)}
                          aria-label={`View details for order ${item.orderId}`}
                        >
                          {item.orderId}
                        </Button>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground whitespace-nowrap text-xs sm:table-cell">
                        {new Date(item.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClassName(item.status)}>
                          {item.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={item.priority === "high" ? "destructive" : "outline"}>{item.priority}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {dueRel === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className={dueRel.overdue ? "text-destructive" : "text-muted-foreground"}>
                            {dueRel.label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "cancelled" ? (
                          <span className="text-muted-foreground text-xs">Cancelled</span>
                        ) : (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Select
                              value={item.status}
                              onValueChange={(value: OperableQueueStatus) => updateStatus(item.id, value)}
                            >
                              <SelectTrigger className="h-8 w-[8.5rem]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="end">
                                {OPERABLE_QUEUE_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status.replaceAll("_", " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              className="h-8"
                              disabled={savingId === item.id}
                              onClick={() => updateStatus(item.id, item.status as OperableQueueStatus)}
                            >
                              {savingId === item.id ? "Saving…" : "Sync"}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <p className="text-muted-foreground text-xs">
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, sortedQueue.length)} of {sortedQueue.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canPreviousPage}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </Button>
                <span className="text-muted-foreground text-xs">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canNextPage}
                  onClick={() => setPageIndex((p) => Math.min(maxPageIndex, p + 1))}
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
