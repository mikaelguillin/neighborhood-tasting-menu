import { NextResponse } from "next/server";
import { cancelOrder } from "@/lib/order-store";
import { requireCustomerUserId } from "@/lib/supabase-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireCustomerUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  try {
    const result = await cancelOrder(id, auth.userId);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "This order cannot be cancelled" }, { status: 400 });
    }
    return NextResponse.json(result.order);
  } catch {
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
