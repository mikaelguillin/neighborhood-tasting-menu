"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import type { VendorInventoryProductWithNeighborhoods } from "@/lib/vendor-inventory-products-store";
import type { NeighborhoodPickerRow } from "@/lib/vendor-neighborhoods-constants";

type NeighborhoodsPayload = {
  catalog: NeighborhoodPickerRow[];
  assignedSlugs: string[];
};

type EditFields = { name: string; description: string };

export function InventoryProductsManager({ onProductsChanged }: { onProductsChanged?: () => void }) {
  const [catalog, setCatalog] = useState<NeighborhoodPickerRow[]>([]);
  const [assignedSlugs, setAssignedSlugs] = useState<string[]>([]);
  const [items, setItems] = useState<VendorInventoryProductWithNeighborhoods[]>([]);
  const [editFields, setEditFields] = useState<Record<string, EditFields>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProductSlugs, setNewProductSlugs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const catalogBySlug = useMemo(() => new Map(catalog.map((n) => [n.slug, n])), [catalog]);

  const sortedAssignedForPicker = useMemo(() => {
    return [...assignedSlugs].sort((a, b) => {
      const na = catalogBySlug.get(a)?.name ?? a;
      const nb = catalogBySlug.get(b)?.name ?? b;
      return na.localeCompare(nb);
    });
  }, [assignedSlugs, catalogBySlug]);

  const load = useCallback(async () => {
    setError(null);
    const [nhRes, invRes] = await Promise.all([
      fetch("/api/vendor/neighborhoods"),
      fetch("/api/vendor/inventory/products"),
    ]);

    if (!nhRes.ok) {
      const body = (await nhRes.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not load neighborhoods");
      return;
    }
    if (!invRes.ok) {
      const body = (await invRes.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not load products");
      return;
    }

    const nhPayload = (await nhRes.json()) as NeighborhoodsPayload;
    const invPayload = (await invRes.json()) as { items: VendorInventoryProductWithNeighborhoods[] };

    setCatalog(nhPayload.catalog);
    setAssignedSlugs(nhPayload.assignedSlugs);
    setItems(invPayload.items);
    setEditFields(
      Object.fromEntries(
        invPayload.items.map((it) => [it.id, { name: it.name, description: it.description ?? "" }]),
      ),
    );
  }, []);

  useEffect(() => {
    async function boot() {
      await load();
      setLoading(false);
    }
    void boot();
  }, [load]);

  async function putNeighborhoods(inventoryId: string, slugs: string[]) {
    const response = await fetch(
      `/api/vendor/inventory/products/${encodeURIComponent(inventoryId)}/neighborhoods`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs }),
      },
    );
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(body?.error ?? "Could not update neighborhoods");
      return false;
    }
    await load();
    onProductsChanged?.();
    return true;
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Enter a product name");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          description: newDescription.trim() || null,
          neighborhoodSlugs: newProductSlugs,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not create product");
        return;
      }
      setNewName("");
      setNewDescription("");
      setNewProductSlugs([]);
      await load();
      onProductsChanged?.();
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveMeta(inventoryId: string) {
    const fields = editFields[inventoryId];
    if (!fields) return;
    const name = fields.name.trim();
    if (!name) {
      setError("Product name cannot be empty");
      return;
    }
    setMutatingId(inventoryId);
    setError(null);
    try {
      const response = await fetch(`/api/vendor/inventory/products/${encodeURIComponent(inventoryId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: fields.description.trim() || null,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not update product");
        return;
      }
      await load();
      onProductsChanged?.();
    } finally {
      setMutatingId(null);
    }
  }

  async function handleDelete(inventoryId: string) {
    if (!globalThis.confirm("Delete this product? Stock and neighborhood links will be removed.")) {
      return;
    }
    setMutatingId(inventoryId);
    setError(null);
    try {
      const response = await fetch(`/api/vendor/inventory/products/${encodeURIComponent(inventoryId)}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not delete product");
        return;
      }
      await load();
      onProductsChanged?.();
    } finally {
      setMutatingId(null);
    }
  }

  async function addNeighborhoodToProduct(inventoryId: string, slug: string) {
    const row = items.find((i) => i.id === inventoryId);
    if (!row || !slug) return;
    if (row.neighborhoodSlugs.includes(slug)) return;
    const next = [...row.neighborhoodSlugs, slug].sort((a, b) => a.localeCompare(b));
    setMutatingId(inventoryId);
    setError(null);
    try {
      await putNeighborhoods(inventoryId, next);
    } finally {
      setMutatingId(null);
    }
  }

  async function removeNeighborhoodFromProduct(inventoryId: string, slug: string) {
    const row = items.find((i) => i.id === inventoryId);
    if (!row) return;
    const next = row.neighborhoodSlugs.filter((s) => s !== slug);
    setMutatingId(inventoryId);
    setError(null);
    try {
      await putNeighborhoods(inventoryId, next);
    } finally {
      setMutatingId(null);
    }
  }

  function slugsAvailableToAdd(linked: string[]) {
    return sortedAssignedForPicker.filter((s) => !linked.includes(s));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading products…
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
          <CardTitle>Add a product</CardTitle>
          <CardDescription>
            Name and optional description are shown to your team and on neighborhood discovery. Product ids are
            generated automatically. Assign neighborhoods you already serve (set those on the Neighborhoods page
            first).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <span className="font-medium text-muted-foreground text-xs">Name</span>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Country sourdough loaf"
              aria-label="New product name"
            />
          </div>
          <div className="grid gap-2">
            <span className="font-medium text-muted-foreground text-xs">Description (optional)</span>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Short note for staff or customers…"
              rows={3}
              aria-label="New product description"
            />
          </div>

          {sortedAssignedForPicker.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Assign at least one neighborhood in Neighborhoods before you can link products to areas.
            </p>
          ) : (
            <div className="space-y-2">
              <span className="font-medium text-muted-foreground text-xs">Neighborhoods (optional)</span>
              <div className="flex flex-wrap gap-2">
                {newProductSlugs.map((slug) => {
                  const row = catalogBySlug.get(slug);
                  return (
                    <Badge key={slug} variant="secondary" className="gap-1 pr-1 font-normal">
                      {row?.name ?? slug}
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-muted-foreground/20"
                        aria-label={`Remove ${slug}`}
                        onClick={() => setNewProductSlugs((prev) => prev.filter((s) => s !== slug))}
                      >
                        <X className="size-3.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
              {slugsAvailableToAdd(newProductSlugs).length > 0 ? (
                <Select
                  key={`new-nh-${newProductSlugs.join("|")}`}
                  onValueChange={(value) => {
                    setNewProductSlugs((prev) =>
                      [...new Set([...prev, value])].sort((a, b) => a.localeCompare(b)),
                    );
                  }}
                >
                  <SelectTrigger className="w-full max-w-md" aria-label="Add neighborhood to new product">
                    <SelectValue placeholder="Add a neighborhood…" />
                  </SelectTrigger>
                  <SelectContent>
                    {slugsAvailableToAdd(newProductSlugs).map((slug) => {
                      const row = catalogBySlug.get(slug);
                      return (
                        <SelectItem key={slug} value={slug}>
                          {row?.name ?? slug}
                          {row?.borough ? ` · ${row.borough}` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          )}

          <Button disabled={creating} onClick={() => void handleCreate()} className="shrink-0">
            {creating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Adding…
              </>
            ) : (
              "Add product"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your products</CardTitle>
          <CardDescription>
            Edit name and description, link neighborhoods with the selector, or delete a product.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No products yet. Add one above.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const fields = editFields[item.id] ?? { name: item.name, description: item.description ?? "" };
                return (
                  <li key={item.id} className="space-y-3 rounded-lg border p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <span className="font-medium text-muted-foreground text-xs">Name</span>
                        <Input
                          value={fields.name}
                          onChange={(e) =>
                            setEditFields((prev) => ({
                              ...prev,
                              [item.id]: { ...fields, name: e.target.value },
                            }))
                          }
                          aria-label={`Name for ${item.id}`}
                        />
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                        <span className="font-medium text-muted-foreground text-xs">Description (optional)</span>
                        <Textarea
                          value={fields.description}
                          onChange={(e) =>
                            setEditFields((prev) => ({
                              ...prev,
                              [item.id]: { ...fields, description: e.target.value },
                            }))
                          }
                          rows={2}
                          aria-label={`Description for ${item.id}`}
                        />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">Inventory row id: {item.id}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={mutatingId === item.id}
                        onClick={() => void handleSaveMeta(item.id)}
                      >
                        {mutatingId === item.id ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutatingId === item.id}
                        onClick={() => void handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>

                    {sortedAssignedForPicker.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Assign neighborhoods to link this product.</p>
                    ) : (
                      <div className="space-y-2">
                        <span className="font-medium text-muted-foreground text-xs">Neighborhoods</span>
                        <div className="flex flex-wrap gap-2">
                          {item.neighborhoodSlugs.map((slug) => {
                            const row = catalogBySlug.get(slug);
                            return (
                              <Badge key={slug} variant="outline" className="gap-1 pr-1 font-normal">
                                {row?.name ?? slug}
                                <button
                                  type="button"
                                  className="rounded p-0.5 hover:bg-muted-foreground/20"
                                  disabled={mutatingId === item.id}
                                  aria-label={`Remove ${slug}`}
                                  onClick={() => void removeNeighborhoodFromProduct(item.id, slug)}
                                >
                                  <X className="size-3.5" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                        {slugsAvailableToAdd(item.neighborhoodSlugs).length > 0 ? (
                          <Select
                            key={`${item.id}-nh-${item.neighborhoodSlugs.join("|")}`}
                            onValueChange={(value) => {
                              void addNeighborhoodToProduct(item.id, value);
                            }}
                          >
                            <SelectTrigger className="w-full max-w-md" aria-label={`Add neighborhood to ${item.name}`}>
                              <SelectValue placeholder="Add a neighborhood…" />
                            </SelectTrigger>
                            <SelectContent>
                              {slugsAvailableToAdd(item.neighborhoodSlugs).map((slug) => {
                                const row = catalogBySlug.get(slug);
                                return (
                                  <SelectItem key={slug} value={slug}>
                                    {row?.name ?? slug}
                                    {row?.borough ? ` · ${row.borough}` : ""}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-muted-foreground text-xs">All your neighborhoods are linked.</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
