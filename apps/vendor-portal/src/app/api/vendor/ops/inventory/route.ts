import { NextResponse } from "next/server";
import { getInventoryItems } from "@/lib/vendor-ops-store";

export async function GET() {
  return NextResponse.json({ items: getInventoryItems() });
}
