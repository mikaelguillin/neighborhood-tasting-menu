"use client";

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERABLE_QUEUE_STATUSES } from "@/lib/vendor-ops-types";
import type { OperableQueueStatus, QueueOrder, QueueStatus } from "@/lib/vendor-ops-types";

const PAGE_SIZE = 10;

type DueAtSort = "asc" | "desc";

function compareQueueByDueAt(a: QueueOrder, b: QueueOrder, direction: DueAtSort): number {
  const tA = new Date(a.dueAt).getTime();
  const tB = new Date(b.dueAt).getTime();
  const delta = tA - tB;
  if (delta !== 0) {
    return direction === "asc" ? delta : -delta;
  }
  return direction === "asc" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
}

function preventPaginationNavigation(event: ReactMouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
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

export function QueuePriorities({
  queue,
  onQueueChange,
}: {
  queue: QueueOrder[];
  onQueueChange: () => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [dueAtSort, setDueAtSort] = useState<DueAtSort>("asc");

  const sortedQueue = useMemo(() => {
    if (queue.length === 0) return [];
    return [...queue].sort((a, b) => compareQueueByDueAt(a, b, dueAtSort));
  }, [queue, dueAtSort]);

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
  }, [dueAtSort]);

  const pageNumbers = useMemo(() => {
    if (pageCount <= 3) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];

    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  const canPreviousPage = safePageIndex > 0;
  const canNextPage = safePageIndex < maxPageIndex;
  const rangeEndExclusive = Math.min(pageStart + pageItems.length, sortedQueue.length);

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
        {queue.length > 0 ? (
          <CardAction>
            <div className="flex flex-col items-end gap-1">
              <span className="text-muted-foreground text-xs">Due time</span>
              <Select value={dueAtSort} onValueChange={(value: DueAtSort) => setDueAtSort(value)}>
                <SelectTrigger className="h-8 w-[11.5rem]" aria-label="Sort queue by due time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="asc">Earliest due first</SelectItem>
                  <SelectItem value="desc">Latest due first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {queue.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders in the queue.</p>
        ) : (
          <>
            {pageItems.map((item) => (
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
                  <p className="text-muted-foreground text-xs">Queue item {item.id}</p>
                  {sourceLabel(item) ? (
                    <p className="text-muted-foreground text-xs">{sourceLabel(item)}</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    Due {new Date(item.dueAt).toLocaleTimeString()} ({item.slaMinutesRemaining} min SLA)
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2 md:mt-0">
                  {item.status === "cancelled" ? (
                    <p className="text-muted-foreground text-xs">
                      Order cancelled — no status changes
                    </p>
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
            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {pageItems.length > 0
                  ? `Viewing ${pageStart + 1}–${rangeEndExclusive} of ${sortedQueue.length.toLocaleString()} orders`
                  : null}
              </p>
              {pageCount > 1 ? (
                <Pagination className="mx-0 w-full justify-start sm:w-auto sm:justify-end">
                  <PaginationContent className="gap-1.5">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        className={!canPreviousPage ? "pointer-events-none opacity-50" : undefined}
                        onClick={(event) => {
                          preventPaginationNavigation(event);
                          if (canPreviousPage) setPageIndex((p) => p - 1);
                        }}
                      />
                    </PaginationItem>
                    {pageNumbers[0] > 1 ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}
                    {pageNumbers.map((pageNumber) => (
                      <PaginationItem key={`page-${pageNumber}`}>
                        <PaginationLink
                          href="#"
                          isActive={safePageIndex === pageNumber - 1}
                          onClick={(event) => {
                            preventPaginationNavigation(event);
                            setPageIndex(pageNumber - 1);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {pageNumbers[pageNumbers.length - 1] < pageCount ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        className={!canNextPage ? "pointer-events-none opacity-50" : undefined}
                        onClick={(event) => {
                          preventPaginationNavigation(event);
                          if (canNextPage) setPageIndex((p) => p + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
