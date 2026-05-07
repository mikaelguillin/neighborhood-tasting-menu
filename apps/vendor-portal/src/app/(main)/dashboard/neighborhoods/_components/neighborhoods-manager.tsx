"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NYC_BOROUGHS, type NeighborhoodPickerRow } from "@/lib/vendor-neighborhoods-constants";

type NeighborhoodProductSummary = { id: string; name: string };

type NeighborhoodsPayload = {
  catalog: NeighborhoodPickerRow[];
  assignedSlugs: string[];
  productsByNeighborhood: Record<string, NeighborhoodProductSummary[]>;
};

export function NeighborhoodsManager() {
  const [catalog, setCatalog] = useState<NeighborhoodPickerRow[]>([]);
  const [assignedSlugs, setAssignedSlugs] = useState<string[]>([]);
  const [productsByNeighborhood, setProductsByNeighborhood] = useState<
    Record<string, NeighborhoodProductSummary[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boroughFilter, setBoroughFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [mutatingSlug, setMutatingSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/vendor/neighborhoods");
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not load neighborhoods");
      return;
    }
    const payload = (await response.json()) as NeighborhoodsPayload;
    setCatalog(payload.catalog);
    setAssignedSlugs(payload.assignedSlugs);
    setProductsByNeighborhood(payload.productsByNeighborhood ?? {});
  }, []);

  useEffect(() => {
    async function boot() {
      await load();
      setLoading(false);
    }
    void boot();
  }, [load]);

  const catalogBySlug = useMemo(() => new Map(catalog.map((n) => [n.slug, n])), [catalog]);

  const assignedSet = useMemo(() => new Set(assignedSlugs), [assignedSlugs]);

  const filterMatch = useCallback(
    (n: NeighborhoodPickerRow, q: string) => {
      if (!q.trim()) return true;
      const lowered = q.trim().toLowerCase();
      return (
        n.name.toLowerCase().includes(lowered) ||
        n.slug.toLowerCase().includes(lowered) ||
        n.borough.toLowerCase().includes(lowered) ||
        n.tagline.toLowerCase().includes(lowered)
      );
    },
    [],
  );

  const availableToAssign = useMemo(() => {
    const q = search;
    return catalog.filter((n) => {
      if (assignedSet.has(n.slug)) return false;
      if (boroughFilter !== "all" && n.borough !== boroughFilter) return false;
      return filterMatch(n, q);
    });
  }, [assignedSet, boroughFilter, catalog, filterMatch, search]);

  const sortedAssignedEntries = useMemo(() => {
    return [...assignedSlugs]
      .sort((a, b) => {
        const rowA = catalogBySlug.get(a);
        const rowB = catalogBySlug.get(b);
        const labelA = rowA?.name ?? a;
        const labelB = rowB?.name ?? b;
        return labelA.localeCompare(labelB);
      })
      .map((slug) => ({ slug, row: catalogBySlug.get(slug) }));
  }, [assignedSlugs, catalogBySlug]);

  async function handleAssign(slug: string) {
    setMutatingSlug(slug);
    setError(null);
    try {
      const response = await fetch("/api/vendor/neighborhoods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not assign neighborhood");
        return;
      }
      await load();
    } finally {
      setMutatingSlug(null);
    }
  }

  async function handleUnassign(slug: string) {
    setMutatingSlug(slug);
    setError(null);
    try {
      const response = await fetch(`/api/vendor/neighborhoods/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not unassign neighborhood");
        return;
      }
      await load();
    } finally {
      setMutatingSlug(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading neighborhoods…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Your neighborhoods</CardTitle>
          <CardDescription>
            Neighborhoods where you currently appear as a maker. Removing a neighborhood stops you from serving that area
            until you assign it again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedAssignedEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No neighborhoods assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {sortedAssignedEntries.map(({ slug, row }) => {
                const products = productsByNeighborhood[slug] ?? [];
                return (
                  <li key={slug} className="flex flex-col gap-2 rounded-lg border px-3 py-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium">{row?.name ?? slug}</span>
                          {row?.borough ? (
                            <Badge className="shrink-0" variant="secondary">
                              {row.borough}
                            </Badge>
                          ) : (
                            <span className="shrink-0 text-muted-foreground text-xs"> ({slug})</span>
                          )}
                        </div>
                        {row?.tagline ? <p className="truncate text-muted-foreground text-xs">{row.tagline}</p> : null}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mutatingSlug === slug}
                        onClick={() => void handleUnassign(slug)}
                        className="inline-flex shrink-0 items-center gap-2"
                      >
                        {mutatingSlug === slug ? (
                          <>
                            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> Saving…
                          </>
                        ) : (
                          "Unassign"
                        )}
                      </Button>
                    </div>
                    <div className="border-border border-t pt-2">
                      <p className="mb-2 font-medium text-muted-foreground text-xs">Products in this neighborhood</p>
                      {products.length > 0 ? (
                        <div className="rounded-md border">
                          <Table aria-label={`Products linked to ${row?.name ?? slug}`}>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Product</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {products.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="max-w-0 whitespace-normal text-xs">
                                    <span className="line-clamp-3">{p.name || "Untitled product"}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          No products linked yet. Add neighborhoods to your products under{" "}
                          <Link href="/dashboard/inventory" className="text-foreground underline underline-offset-2">
                            Inventory
                          </Link>
                          .
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign to an existing neighborhood</CardTitle>
          <CardDescription>
            Choose from neighborhoods already curated for New York&apos;s five boroughs. You cannot create new neighborhoods
            here—that is managed by our team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid w-full gap-2 sm:max-w-xs">
              <span className="font-medium text-muted-foreground text-xs">Borough</span>
              <Select value={boroughFilter} onValueChange={setBoroughFilter}>
                <SelectTrigger aria-label="Filter by borough">
                  <SelectValue placeholder="All boroughs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All boroughs</SelectItem>
                  {NYC_BOROUGHS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid flex-1 gap-2">
              <span className="font-medium text-muted-foreground text-xs">Search</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, borough, or tagline…"
                aria-label="Search neighborhoods"
              />
            </div>
          </div>

          {availableToAssign.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No matching neighborhoods left to assign. Try another borough or search, or remove an assignment above.
            </p>
          ) : (
            <ul className="space-y-2">
              {availableToAssign.map((n) => (
                <li
                  key={n.slug}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{n.name}</span>
                      <Badge className="shrink-0" variant="outline">
                        {n.borough}
                      </Badge>
                    </div>
                    <p className="truncate text-muted-foreground text-xs">{n.tagline}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={mutatingSlug === n.slug}
                    onClick={() => void handleAssign(n.slug)}
                    className="inline-flex items-center gap-2"
                  >
                    {mutatingSlug === n.slug ? (
                      <>
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> Saving…
                      </>
                    ) : (
                      "Assign"
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
