import { NextResponse } from "next/server";
import { getQueueOrders } from "@/lib/vendor-ops-store";

export async function GET() {
  return NextResponse.json({ items: getQueueOrders() });
}
