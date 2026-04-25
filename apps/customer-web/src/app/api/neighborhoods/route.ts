import { NextResponse } from "next/server";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

type SortOption = "featured" | "name-asc" | "name-desc";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = normalize(searchParams.get("q") ?? "");
  const borough = searchParams.get("borough") ?? "all";
  const sort = (searchParams.get("sort") ?? "featured") as SortOption;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.max(1, Math.min(24, Number(searchParams.get("pageSize") ?? "6")));

  const filtered = NEIGHBORHOODS.filter((neighborhood) => {
    if (borough !== "all" && neighborhood.borough !== borough) {
      return false;
    }

    if (!q) {
      return true;
    }

    const haystack = [
      neighborhood.name,
      neighborhood.borough,
      neighborhood.tagline,
      neighborhood.description,
      ...neighborhood.items,
      ...neighborhood.vendors.map((vendor) => `${vendor.name} ${vendor.craft}`),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  const sorted = [...filtered].sort((left, right) => {
    if (sort === "name-asc") {
      return left.name.localeCompare(right.name);
    }

    if (sort === "name-desc") {
      return right.name.localeCompare(left.name);
    }

    if (left.highlight === right.highlight) {
      return left.name.localeCompare(right.name);
    }

    return left.highlight ? -1 : 1;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return NextResponse.json({
    items: sorted.slice(start, end),
    total,
    page: safePage,
    pageSize,
    totalPages,
  });
}
