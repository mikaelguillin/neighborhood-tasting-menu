import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { InventoryItem, OperableQueueStatus, QueueOrder, QueuePriority, QueueStatus } from "@/lib/vendor-ops-types";

function computeSlaMinutesRemaining(dueAt: string) {
  return Math.round((new Date(dueAt).getTime() - Date.now()) / 60000);
}

function toQueueOrder(row: {
  id: string;
  order_id: string;
  due_at: string;
  sla_minutes_remaining: number;
  status: QueueStatus;
  priority: QueuePriority;
  source_type?: string | null;
  source_label?: string | null;
  source_slug?: string | null;
}): QueueOrder {
  const sourceType =
    row.source_type === "plan" || row.source_type === "neighborhood" ? row.source_type : null;
  return {
    id: row.id,
    orderId: row.order_id,
    dueAt: row.due_at,
    slaMinutesRemaining: row.sla_minutes_remaining,
    status: row.status,
    priority: row.priority,
    sourceType,
    sourceLabel: row.source_label ?? null,
    sourceSlug: row.source_slug ?? null,
  };
}

type ProductEmbed = { name: string; description: string | null };
type QueueOrderRpcRow = {
  id: string;
  order_id: string;
  due_at: string;
  sla_minutes_remaining: number;
  status: QueueStatus;
  priority: QueuePriority;
  source_type: string | null;
  source_label: string | null;
  source_slug: string | null;
};

function toInventoryItem(row: {
  id: string;
  product_id: string;
  stock: number;
  low_stock_threshold: number;
  available: boolean;
  out_of_stock_reason: string | null;
  products: ProductEmbed | ProductEmbed[] | null;
}): InventoryItem {
  const p = row.products;
  const product = Array.isArray(p) ? p[0] : p;
  return {
    id: row.id,
    productId: row.product_id,
    name: product?.name ?? "",
    description: product?.description ?? null,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    available: row.available,
    outOfStockReason: row.out_of_stock_reason,
  };
}

export async function getQueueOrders(vendorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_vendor_queue_orders", {
    v_vendor_id: vendorId,
  });

  if (error || !data) return [];
  return (data as QueueOrderRpcRow[]).map((item) =>
    toQueueOrder({
      ...item,
      sla_minutes_remaining: computeSlaMinutesRemaining(item.due_at),
    }),
  );
}

export type UpdateQueueStatusResult =
  | { ok: true; order: QueueOrder }
  | { ok: false; reason: "not_found" | "cancelled" };

export async function updateQueueStatus(
  vendorId: string,
  id: string,
  status: OperableQueueStatus,
): Promise<UpdateQueueStatusResult> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("vendor_queue_orders")
    .select("id,order_id,due_at,sla_minutes_remaining,status,priority")
    .eq("vendor_id", vendorId)
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, reason: "not_found" };
  }
  if (existing.status === "cancelled") {
    return { ok: false, reason: "cancelled" };
  }

  const { data, error } = await supabase
    .from("vendor_queue_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("vendor_id", vendorId)
    .eq("id", id)
    .select("id,order_id,due_at,sla_minutes_remaining,status,priority")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }
  return {
    ok: true,
    order: toQueueOrder({
      ...data,
      sla_minutes_remaining: computeSlaMinutesRemaining(data.due_at),
    }),
  };
}

export async function getInventoryItems(vendorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_inventory_products")
    .select(
      "id,product_id,stock,low_stock_threshold,available,out_of_stock_reason,products(name,description)",
    )
    .eq("vendor_id", vendorId)
    .order("name", { ascending: true, foreignTable: "products" });

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
    .from("vendor_inventory_products")
    .update(payload)
    .eq("vendor_id", vendorId)
    .eq("id", id)
    .select(
      "id,product_id,stock,low_stock_threshold,available,out_of_stock_reason,products(name,description)",
    )
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
    .from("vendor_inventory_products")
    .update(updatePayload)
    .eq("vendor_id", vendorId)
    .in("id", ids);

  if (error) return [];
  const allItems = await getInventoryItems(vendorId);
  const selected = new Set(ids);
  return allItems.filter((item) => selected.has(item.id));
}
