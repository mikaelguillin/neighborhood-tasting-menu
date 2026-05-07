"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { VendorInventoryProductWithNeighborhoods } from "@/lib/vendor-inventory-products-store";
import type { NeighborhoodPickerRow } from "@ntm/types";
import { formatPriceInput, parsePriceInputToCents } from "@/lib/utils";

type NeighborhoodsPayload = {
  catalog: NeighborhoodPickerRow[];
  assignedSlugs: string[];
};

type EditFields = { name: string; description: string; priceInput: string };

function NeighborhoodPicker({
  catalogBySlug,
  sortedAssignedForPicker,
  selectedSlugs,
  onRemove,
  onAdd,
  disabled,
  ariaPrefix,
}: {
  catalogBySlug: Map<string, NeighborhoodPickerRow>;
  sortedAssignedForPicker: string[];
  selectedSlugs: string[];
  onRemove: (slug: string) => void;
  onAdd: (slug: string) => void;
  disabled?: boolean;
  ariaPrefix: string;
}) {
  const available = sortedAssignedForPicker.filter((s) => !selectedSlugs.includes(s));

  if (sortedAssignedForPicker.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Assign at least one neighborhood in Neighborhoods before you can link products to areas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="font-medium text-muted-foreground text-xs">Neighborhoods (optional)</span>
      <div className="flex flex-wrap gap-2">
        {selectedSlugs.map((slug) => {
          const row = catalogBySlug.get(slug);
          return (
            <Badge key={slug} variant="secondary" className="gap-1 pr-1 font-normal">
              {row?.name ?? slug}
              <button
                type="button"
                className="rounded p-0.5 hover:bg-muted-foreground/20"
                disabled={disabled}
                aria-label={`Remove ${slug}`}
                onClick={() => onRemove(slug)}
              >
                <X className="size-3.5" />
              </button>
            </Badge>
          );
        })}
      </div>
      {available.length > 0 ? (
        <Select
          key={`nh-${selectedSlugs.join("|")}`}
          disabled={disabled}
          onValueChange={(value) => {
            onAdd(value);
          }}
        >
          <SelectTrigger className="w-full" aria-label={`${ariaPrefix} add neighborhood`}>
            <SelectValue placeholder="Add a neighborhood…" />
          </SelectTrigger>
          <SelectContent>
            {available.map((slug) => {
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
      ) : selectedSlugs.length > 0 ? (
        <p className="text-muted-foreground text-xs">All your neighborhoods are linked.</p>
      ) : null}
    </div>
  );
}

export function InventoryProductsManager({ onProductsChanged }: { onProductsChanged?: () => void }) {
  const [catalog, setCatalog] = useState<NeighborhoodPickerRow[]>([]);
  const [assignedSlugs, setAssignedSlugs] = useState<string[]>([]);
  const [items, setItems] = useState<VendorInventoryProductWithNeighborhoods[]>([]);
  const [editFields, setEditFields] = useState<Record<string, EditFields>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriceInput, setNewPriceInput] = useState("");
  const [newProductSlugs, setNewProductSlugs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
        invPayload.items.map((it) => [
          it.id,
          { name: it.name, description: it.description ?? "", priceInput: formatPriceInput(it.priceCents) },
        ]),
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

  function resetAddForm() {
    setNewName("");
    setNewDescription("");
    setNewPriceInput("");
    setNewProductSlugs([]);
  }

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
    const priceCents = parsePriceInputToCents(newPriceInput);
    if (Number.isNaN(priceCents)) {
      setError("Enter a valid price (for example 9.99)");
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
          priceCents,
          neighborhoodSlugs: newProductSlugs,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not create product");
        return;
      }
      resetAddForm();
      setAddOpen(false);
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
    const priceCents = parsePriceInputToCents(fields.priceInput);
    if (Number.isNaN(priceCents)) {
      setError("Enter a valid price (for example 9.99)");
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
          priceCents,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not update product");
        return;
      }
      setEditingId(null);
      await load();
      onProductsChanged?.();
    } finally {
      setMutatingId(null);
    }
  }

  async function performDeleteProduct(inventoryId: string) {
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
      setDeleteConfirmId(null);
      if (editingId === inventoryId) setEditingId(null);
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

  const editingItem = editingId ? items.find((i) => i.id === editingId) : undefined;
  const editingBusy = editingId !== null && mutatingId === editingId;
  const deleteTarget = deleteConfirmId ? items.find((i) => i.id === deleteConfirmId) : undefined;
  const deleteBusy = deleteConfirmId !== null && mutatingId === deleteConfirmId;

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
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage product references and neighborhood coverage.
            </CardDescription>
          </div>
          <Button type="button" className="shrink-0" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add product
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No products yet. Use &quot;Add product&quot; to create your first reference.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden min-w-[12rem] md:table-cell">Description</TableHead>
                  <TableHead className="hidden lg:table-cell">Neighborhoods</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const nhCount = item.neighborhoodSlugs.length;
                  const preview = item.neighborhoodSlugs.slice(0, 2);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[14rem] font-medium">
                        <span className="line-clamp-2">{item.name}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {item.priceCents === null ? "—" : `$${(item.priceCents / 100).toFixed(2)}`}
                      </TableCell>
                      <TableCell className="hidden max-w-xs md:table-cell">
                        {item.description ? (
                          <span className="text-muted-foreground line-clamp-2 text-xs">{item.description}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {nhCount === 0 ? (
                          <span className="text-muted-foreground text-xs">None</span>
                        ) : (
                          <div className="flex max-w-[18rem] flex-wrap gap-1">
                            {preview.map((slug) => {
                              const row = catalogBySlug.get(slug);
                              return (
                                <Badge key={slug} variant="outline" className="font-normal text-xs">
                                  {row?.name ?? slug}
                                </Badge>
                              );
                            })}
                            {nhCount > 2 ? (
                              <Badge variant="secondary" className="font-normal text-xs">
                                +{nhCount - 2}
                              </Badge>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            disabled={mutatingId === item.id}
                            aria-label={`Edit ${item.name}`}
                            onClick={() => setEditingId(item.id)}
                          >
                            <Pencil className="size-4" aria-hidden />
                            <span className="hidden sm:inline sm:ml-1">Edit</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={mutatingId === item.id}
                            aria-label={`Delete ${item.name}`}
                            onClick={() => setDeleteConfirmId(item.id)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                            <span className="hidden sm:inline sm:ml-1">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            resetAddForm();
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton={!creating}>
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>
              Name and optional description are shown to your team and on neighborhood discovery. Assign neighborhoods
              you already serve (set those on the Neighborhoods page first).
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[min(70vh,32rem)] gap-4 overflow-y-auto pr-1">
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
              <span className="font-medium text-muted-foreground text-xs">Price (optional)</span>
              <Input
                value={newPriceInput}
                onChange={(e) => setNewPriceInput(e.target.value)}
                placeholder="e.g. 9.99"
                inputMode="decimal"
                aria-label="New product price"
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
            <NeighborhoodPicker
              catalogBySlug={catalogBySlug}
              sortedAssignedForPicker={sortedAssignedForPicker}
              selectedSlugs={newProductSlugs}
              disabled={creating}
              ariaPrefix="New product"
              onRemove={(slug) => setNewProductSlugs((prev) => prev.filter((s) => s !== slug))}
              onAdd={(slug) =>
                setNewProductSlugs((prev) => [...new Set([...prev, slug])].sort((a, b) => a.localeCompare(b)))
              }
            />
          </div>
          <DialogFooter className="border-t-0 bg-transparent sm:justify-end">
            <Button type="button" variant="outline" disabled={creating} onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={creating} onClick={() => void handleCreate()}>
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Adding…
                </>
              ) : (
                "Add product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingId !== null && editingItem !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton={!editingBusy}>
          {editingItem ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit product</DialogTitle>
                <DialogDescription>
                  Update how this product appears and which neighborhoods it covers. Inventory row id:{" "}
                  <span className="font-mono text-xs">{editingItem.id}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid max-h-[min(70vh,32rem)] gap-4 overflow-y-auto pr-1">
                <div className="grid gap-2">
                  <span className="font-medium text-muted-foreground text-xs">Name</span>
                  <Input
                    value={editFields[editingItem.id]?.name ?? editingItem.name}
                    onChange={(e) =>
                      setEditFields((prev) => ({
                        ...prev,
                        [editingItem.id]: {
                          ...(prev[editingItem.id] ?? {
                            name: editingItem.name,
                            description: editingItem.description ?? "",
                            priceInput: formatPriceInput(editingItem.priceCents),
                          }),
                          name: e.target.value,
                        },
                      }))
                    }
                    aria-label={`Name for ${editingItem.id}`}
                  />
                </div>
                <div className="grid gap-2">
                  <span className="font-medium text-muted-foreground text-xs">Description (optional)</span>
                  <Textarea
                    value={editFields[editingItem.id]?.description ?? editingItem.description ?? ""}
                    onChange={(e) =>
                      setEditFields((prev) => ({
                        ...prev,
                        [editingItem.id]: {
                          ...(prev[editingItem.id] ?? {
                            name: editingItem.name,
                            description: editingItem.description ?? "",
                            priceInput: formatPriceInput(editingItem.priceCents),
                          }),
                          description: e.target.value,
                        },
                      }))
                    }
                    rows={3}
                    aria-label={`Description for ${editingItem.id}`}
                  />
                </div>
                <div className="grid gap-2">
                  <span className="font-medium text-muted-foreground text-xs">Price (optional)</span>
                  <Input
                    value={editFields[editingItem.id]?.priceInput ?? formatPriceInput(editingItem.priceCents)}
                    onChange={(e) =>
                      setEditFields((prev) => ({
                        ...prev,
                        [editingItem.id]: {
                          ...(prev[editingItem.id] ?? {
                            name: editingItem.name,
                            description: editingItem.description ?? "",
                            priceInput: formatPriceInput(editingItem.priceCents),
                          }),
                          priceInput: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 9.99"
                    inputMode="decimal"
                    aria-label={`Price for ${editingItem.id}`}
                  />
                </div>
                <NeighborhoodPicker
                  catalogBySlug={catalogBySlug}
                  sortedAssignedForPicker={sortedAssignedForPicker}
                  selectedSlugs={editingItem.neighborhoodSlugs}
                  disabled={editingBusy}
                  ariaPrefix={`Edit ${editingItem.name}`}
                  onRemove={(slug) => void removeNeighborhoodFromProduct(editingItem.id, slug)}
                  onAdd={(slug) => void addNeighborhoodToProduct(editingItem.id, slug)}
                />
              </div>
              <DialogFooter className="flex-col gap-2 border-t-0 bg-transparent sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
                  disabled={editingBusy}
                  onClick={() => setDeleteConfirmId(editingItem.id)}
                >
                  Delete product
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" disabled={editingBusy} onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button type="button" disabled={editingBusy} onClick={() => void handleSaveMeta(editingItem.id)}>
                    {editingBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden /> Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) {
            setDeleteConfirmId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be removed. Stock and neighborhood links will be removed. This cannot be undone.`
                : "This product will be removed. Stock and neighborhood links will be removed. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy || deleteConfirmId === null}
              onClick={() => deleteConfirmId && void performDeleteProduct(deleteConfirmId)}
            >
              {deleteBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Deleting…
                </>
              ) : (
                "Delete product"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
