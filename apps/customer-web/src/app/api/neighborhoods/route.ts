import { NextResponse } from "next/server";
import { listNeighborhoods } from "@/lib/catalog-store";

type SortOption = "featured" | "name-asc" | "name-desc";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const borough = searchParams.get("borough") ?? "all";
  const sort = (searchParams.get("sort") ?? "featured") as SortOption;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.max(1, Math.min(24, Number(searchParams.get("pageSize") ?? "6")));

  const payload = await listNeighborhoods({ q, borough, sort, page, pageSize });
  return NextResponse.json(payload);
}
