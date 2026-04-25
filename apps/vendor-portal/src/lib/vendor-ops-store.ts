export type QueueStatus = "new" | "confirmed" | "preparing" | "ready" | "fulfilled";
export type QueuePriority = "high" | "medium" | "low";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

function computeSlaMinutesRemaining(dueAt: string) {
  return Math.round((new Date(dueAt).getTime() - Date.now()) / 60000);
}

function toQueueOrder(row: {
  id: string;
  customer_name: string;
  neighborhood: string;
  item_count: number;
  due_at: string;
  sla_minutes_remaining: number;
  status: QueueStatus;
  priority: QueuePriority;
}): QueueOrder {
  return {
    id: row.id,
    customerName: row.customer_name,
    neighborhood: row.neighborhood,
    itemCount: row.item_count,
    dueAt: row.due_at,
    slaMinutesRemaining: row.sla_minutes_remaining,
    status: row.status,
    priority: row.priority,
  };
}

function toInventoryItem(row: {
  id: string;
  name: string;
  stock: number;
  low_stock_threshold: number;
  available: boolean;
  out_of_stock_reason: string | null;
}): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    available: row.available,
    outOfStockReason: row.out_of_stock_reason,
  };
}

export async function getQueueOrders(vendorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_queue_orders")
    .select("id,customer_name,neighborhood,item_count,due_at,sla_minutes_remaining,status,priority")
    .eq("vendor_id", vendorId)
    .order("due_at", { ascending: true });

  if (error || !data) return [];
  return data.map((item) =>
    toQueueOrder({
      ...item,
      sla_minutes_remaining: computeSlaMinutesRemaining(item.due_at),
    }),
  );
}

export async function updateQueueStatus(vendorId: string, id: string, status: QueueStatus) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_queue_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("vendor_id", vendorId)
    .eq("id", id)
    .select("id,customer_name,neighborhood,item_count,due_at,sla_minutes_remaining,status,priority")
    .maybeSingle();

  if (error || !data) return null;
  return toQueueOrder({
    ...data,
    sla_minutes_remaining: computeSlaMinutesRemaining(data.due_at),
  });
}

export async function getInventoryItems(vendorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_inventory_items")
    .select("id,name,stock,low_stock_threshold,available,out_of_stock_reason")
    .eq("vendor_id", vendorId)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data.map(toInventoryItem);
}

export async function updateInventoryItem(
  vendorId: string,
  id: string,
  patch: Partial<Pick<InventoryItem, "stock" | "available" | "outOfStockReason">>,
) {
  const payload: {
    stock?: number;
    available?: boolean;
    out_of_stock_reason?: string | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (typeof patch.stock === "number") payload.stock = Math.max(0, patch.stock);
  if (typeof patch.available === "boolean") payload.available = patch.available;
  if (patch.outOfStockReason !== undefined) payload.out_of_stock_reason = patch.outOfStockReason;
  if (patch.available === true) payload.out_of_stock_reason = null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_inventory_items")
    .update(payload)
    .eq("vendor_id", vendorId)
    .eq("id", id)
    .select("id,name,stock,low_stock_threshold,available,out_of_stock_reason")
    .maybeSingle();

  if (error || !data) return null;
  return toInventoryItem(data);
}

export async function bulkSetInventoryAvailability(vendorId: string, ids: string[], available: boolean) {
  if (ids.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const updatePayload = {
    available,
    out_of_stock_reason: available ? null : "Temporarily unavailable",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("vendor_inventory_items")
    .update(updatePayload)
    .eq("vendor_id", vendorId)
    .in("id", ids);

  if (error) return [];
  const allItems = await getInventoryItems(vendorId);
  const selected = new Set(ids);
  return allItems.filter((item) => selected.has(item.id));
}
