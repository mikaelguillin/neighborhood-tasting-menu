"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import { NeighborhoodCard } from "@/components/neighborhood-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Neighborhood } from "@/data/neighborhoods";

type DiscoveryResponse = {
  items: Neighborhood[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type SortOption = "featured" | "name-asc" | "name-desc";

const PAGE_SIZE = 6;

const BOROUGH_OPTIONS = [
  { value: "all", label: "All boroughs" },
  { value: "Manhattan", label: "Manhattan" },
  { value: "Queens", label: "Queens" },
  { value: "Brooklyn", label: "Brooklyn" },
  { value: "Bronx", label: "Bronx" },
  { value: "Staten Island", label: "Staten Island" },
] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
];

export function NeighborhoodDiscovery() {
  const [query, setQuery] = useState("");
  const [borough, setBorough] = useState("all");
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: query,
      borough,
      sort,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/neighborhoods?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load neighborhoods (${response.status})`);
        }

        const payload = (await response.json()) as DiscoveryResponse;
        setData(payload);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Unable to load discovery";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [borough, page, query, reloadNonce, sort]);

  useEffect(() => {
    setPage(1);
  }, [borough, query, sort]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim().length > 0) count += 1;
    if (borough !== "all") count += 1;
    return count;
  }, [borough, query]);

  const total = data?.total ?? 0;
  const currentPage = data?.page ?? page;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="rounded-[12px] bg-card p-4 shadow-[var(--shadow-card)] md:p-5">
        <div className="grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.7fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Search neighborhoods
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by neighborhood, vendor, or item"
                className="h-10 pl-9"
                aria-label="Search neighborhoods"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Borough
            </span>
            <Select value={borough} onValueChange={setBorough}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOROUGH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Sort
            </span>
            <Select value={sort} onValueChange={(value: SortOption) => setSort(value)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => {
              setQuery("");
              setBorough("all");
              setSort("featured");
            }}
            disabled={activeFilterCount === 0 && sort === "featured"}
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-foreground/70">
        <p>
          {loading ? "Loading neighborhoods..." : `${total} result${total === 1 ? "" : "s"} found`}
        </p>
        {totalPages > 1 && !loading && (
          <p>
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-[12px] border border-destructive/30 bg-destructive/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Couldn&apos;t load neighborhoods
          </p>
          <p className="mt-2 text-sm text-foreground/75">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => setReloadNonce((value) => value + 1)}>
            Retry
          </Button>
        </div>
      )}

      {!error && loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[12px] bg-card p-4 shadow-[var(--shadow-card)]">
              <Skeleton className="aspect-[4/3] w-full rounded-[10px]" />
              <Skeleton className="mt-4 h-4 w-1/3" />
              <Skeleton className="mt-3 h-6 w-4/5" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!error && !loading && data && data.items.length === 0 && (
        <div className="rounded-[12px] bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <h3 className="text-xl font-semibold tracking-tight text-brand">No neighborhoods match yet</h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Try a broader search term or clear filters to browse this season&apos;s full rotation.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              setQuery("");
              setBorough("all");
              setSort("featured");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {!error && !loading && data && data.items.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <NeighborhoodCard key={item.slug} n={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
