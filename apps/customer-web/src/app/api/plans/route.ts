import { NextResponse } from "next/server";
import { listPlans } from "@/lib/catalog-store";

export async function GET() {
  const items = await listPlans();
  return NextResponse.json({ items });
}
