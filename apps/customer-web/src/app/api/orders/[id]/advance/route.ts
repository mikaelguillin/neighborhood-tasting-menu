import { NextResponse } from "next/server";
import { advanceOrderStatus } from "@/lib/order-store";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const order = advanceOrderStatus(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
