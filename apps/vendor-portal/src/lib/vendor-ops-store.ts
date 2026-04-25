export type QueueStatus = "new" | "confirmed" | "preparing" | "ready" | "fulfilled";
export type QueuePriority = "high" | "medium" | "low";

export type QueueOrder = {
  id: string;
  customerName: string;
  neighborhood: string;
  itemCount: number;
  dueAt: string;
  slaMinutesRemaining: number;
  status: QueueStatus;
  priority: QueuePriority;
};

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  available: boolean;
  outOfStockReason: string | null;
};

const queueOrders = new Map<string, QueueOrder>();
const inventoryItems = new Map<string, InventoryItem>();

function seed() {
  if (queueOrders.size > 0 || inventoryItems.size > 0) return;

  const now = Date.now();

  const queueSeed: QueueOrder[] = [
    {
      id: "q_1001",
      customerName: "A. Parker",
      neighborhood: "Long Island City",
      itemCount: 7,
      dueAt: new Date(now + 1000 * 60 * 42).toISOString(),
      slaMinutesRemaining: 42,
      status: "new",
      priority: "high",
    },
    {
      id: "q_1002",
      customerName: "R. Singh",
      neighborhood: "Astoria",
      itemCount: 5,
      dueAt: new Date(now + 1000 * 60 * 88).toISOString(),
      slaMinutesRemaining: 88,
      status: "confirmed",
      priority: "medium",
    },
    {
      id: "q_1003",
      customerName: "J. Chen",
      neighborhood: "West Village",
      itemCount: 8,
      dueAt: new Date(now + 1000 * 60 * 27).toISOString(),
      slaMinutesRemaining: 27,
      status: "preparing",
      priority: "high",
    },
    {
      id: "q_1004",
      customerName: "L. Wilson",
      neighborhood: "Lower East Side",
      itemCount: 6,
      dueAt: new Date(now + 1000 * 60 * 18).toISOString(),
      slaMinutesRemaining: 18,
      status: "ready",
      priority: "high",
    },
    {
      id: "q_1005",
      customerName: "S. Gomez",
      neighborhood: "Long Island City",
      itemCount: 4,
      dueAt: new Date(now - 1000 * 60 * 35).toISOString(),
      slaMinutesRemaining: -35,
      status: "fulfilled",
      priority: "low",
    },
  ];

  const inventorySeed: InventoryItem[] = [
    {
      id: "inv_001",
      name: "Country Sourdough Loaf",
      stock: 32,
      lowStockThreshold: 15,
      available: true,
      outOfStockReason: null,
    },
    {
      id: "inv_002",
      name: "Mini Chocolate Babka",
      stock: 9,
      lowStockThreshold: 10,
      available: true,
      outOfStockReason: null,
    },
    {
      id: "inv_003",
      name: "Half-Dozen Bagels",
      stock: 0,
      lowStockThreshold: 8,
      available: false,
      outOfStockReason: "Flour delivery delayed",
    },
    {
      id: "inv_004",
      name: "Wildflower Honey Jar",
      stock: 14,
      lowStockThreshold: 12,
      available: true,
      outOfStockReason: null,
    },
  ];

  queueSeed.forEach((item) => queueOrders.set(item.id, item));
  inventorySeed.forEach((item) => inventoryItems.set(item.id, item));
}

seed();

export function getQueueOrders() {
  return Array.from(queueOrders.values()).sort((left, right) => left.dueAt.localeCompare(right.dueAt));
}

export function updateQueueStatus(id: string, status: QueueStatus) {
  const record = queueOrders.get(id);
  if (!record) return null;
  record.status = status;
  queueOrders.set(id, record);
  return record;
}

export function getInventoryItems() {
  return Array.from(inventoryItems.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export function updateInventoryItem(
  id: string,
  patch: Partial<Pick<InventoryItem, "stock" | "available" | "outOfStockReason">>,
) {
  const record = inventoryItems.get(id);
  if (!record) return null;

  if (typeof patch.stock === "number") {
    record.stock = Math.max(0, patch.stock);
  }

  if (typeof patch.available === "boolean") {
    record.available = patch.available;
    if (patch.available) {
      record.outOfStockReason = null;
    }
  }

  if (patch.outOfStockReason !== undefined) {
    record.outOfStockReason = patch.outOfStockReason;
  }

  inventoryItems.set(id, record);
  return record;
}

export function bulkSetInventoryAvailability(ids: string[], available: boolean) {
  const updated: InventoryItem[] = [];
  for (const id of ids) {
    const record = inventoryItems.get(id);
    if (!record) continue;

    record.available = available;
    if (available) {
      record.outOfStockReason = null;
    } else if (!record.outOfStockReason) {
      record.outOfStockReason = "Temporarily unavailable";
    }
    inventoryItems.set(id, record);
    updated.push(record);
  }

  return updated;
}
