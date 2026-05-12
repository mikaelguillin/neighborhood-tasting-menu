export const OPERABLE_QUEUE_STATUSES = ["new", "confirmed", "preparing", "ready", "fulfilled"] as const;
export type OperableQueueStatus = (typeof OPERABLE_QUEUE_STATUSES)[number];

export type QueueStatus = OperableQueueStatus | "cancelled";
export type QueuePriority = "high" | "medium" | "low";

export type QueueOrder = {
  id: string;
  orderId: string;
  createdAt: string;
  dueAt: string;
  slaMinutesRemaining: number;
  status: QueueStatus;
  priority: QueuePriority;
  sourceType: "plan" | "neighborhood" | null;
  sourceLabel: string | null;
  sourceSlug: string | null;
  customerName: string | null;
  customerAddress: string | null;
};

export type InventoryItem = {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  stock: number;
  lowStockThreshold: number;
  available: boolean;
  outOfStockReason: string | null;
};
