"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { InventoryControls } from "./_components/inventory-controls";
import { InventoryProductsManager } from "./_components/inventory-products-manager";
import type { InventoryItem } from "@/lib/vendor-ops-store";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingControls, setLoadingControls] = useState(true);

  const loadInventory = useCallback(async () => {
    const response = await fetch("/api/vendor/ops/inventory");
    if (!response.ok) return;
    const payload = (await response.json()) as { items: InventoryItem[] };
    setInventory(payload.items);
  }, []);

  useEffect(() => {
    async function boot() {
      await loadInventory();
      setLoadingControls(false);
    }
    void boot();
  }, [loadInventory]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <section className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Inventory</h1>
        <p className="text-muted-foreground text-sm">
          Manage product references and neighborhood coverage, then adjust stock and availability.
        </p>
      </section>
      <InventoryProductsManager onProductsChanged={loadInventory} />
      {loadingControls ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading inventory controls…
        </div>
      ) : (
        <InventoryControls items={inventory} onInventoryChange={loadInventory} />
      )}
    </div>
  );
}
