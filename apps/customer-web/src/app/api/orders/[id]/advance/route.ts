import { NextResponse } from "next/server";
import { advanceOrderStatus } from "@/lib/order-store";
import { requireCustomerUserId } from "@/lib/supabase-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireCustomerUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const order = await advanceOrderStatus(id, auth.userId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
