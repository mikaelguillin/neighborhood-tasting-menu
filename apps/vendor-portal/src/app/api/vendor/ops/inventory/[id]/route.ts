import { NextResponse } from "next/server";
import { updateInventoryItem } from "@/lib/vendor-ops-store";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = (await request.json().catch(() => null)) as
    | { stock?: number; available?: boolean; outOfStockReason?: string | null }
    | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid inventory payload" }, { status: 400 });
  }

  const { id } = await context.params;
  const updated = updateInventoryItem(id, {
    stock: typeof payload.stock === "number" ? payload.stock : undefined,
    available: typeof payload.available === "boolean" ? payload.available : undefined,
    outOfStockReason:
      payload.outOfStockReason === undefined ? undefined : (payload.outOfStockReason ?? null),
  });

  if (!updated) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
