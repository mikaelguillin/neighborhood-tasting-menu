"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { InventoryItem } from "@/lib/vendor-ops-store";

export function InventoryControls({
  items,
  onInventoryChange,
}: {
  items: InventoryItem[];
  onInventoryChange: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const allSelected = useMemo(
    () => items.length > 0 && selected.length === items.length,
    [items.length, selected.length],
  );

  function toggleSelected(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  async function patchInventory(
    id: string,
    payload: Partial<Pick<InventoryItem, "stock" | "available" | "outOfStockReason">>,
  ) {
    setSaving(id);
    await fetch(`/api/vendor/ops/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await onInventoryChange();
    setSaving(null);
  }

  async function applyBulk(available: boolean) {
    if (selected.length === 0) return;
    setSaving("bulk");
    await fetch("/api/vendor/ops/inventory/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, available }),
    });
    await onInventoryChange();
    setSaving(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory controls</CardTitle>
        <CardDescription>Bulk toggle availability and update stock with low-stock visibility.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={selected.length === 0 || saving === "bulk"}
            onClick={() => applyBulk(true)}
          >
            Mark selected available
          </Button>
          <Button
            variant="outline"
            disabled={selected.length === 0 || saving === "bulk"}
            onClick={() => applyBulk(false)}
          >
            Mark selected unavailable
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSelected(allSelected ? [] : items.map((item) => item.id))}
          >
            {allSelected ? "Clear selection" : "Select all"}
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const isLowStock = item.stock <= item.lowStockThreshold;
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[auto_1fr_auto_auto_auto]"
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={() => toggleSelected(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.description ? (
                    <p className="text-muted-foreground line-clamp-2 text-xs">{item.description}</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">Threshold: {item.lowStockThreshold}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isLowStock && <Badge variant="destructive">Low stock</Badge>}
                  {!item.available && <Badge variant="secondary">Unavailable</Badge>}
                </div>
                <Input
                  type="number"
                  min={0}
                  defaultValue={item.stock}
                  className="w-28"
                  onBlur={(event) => patchInventory(item.id, { stock: Number(event.target.value) })}
                />
                <Button
                  variant="outline"
                  disabled={saving === item.id}
                  onClick={() =>
                    patchInventory(item.id, {
                      available: !item.available,
                      outOfStockReason: item.available ? "Temporarily unavailable" : null,
                    })
                  }
                >
                  {item.available ? "Set unavailable" : "Set available"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
