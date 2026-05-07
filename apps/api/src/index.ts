import Fastify from "fastify";
import { z } from "zod";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { ok: true };
});

app.get("/version", async () => {
  const schema = z.object({ name: z.string(), version: z.string() });
  return schema.parse({ name: "@ntm/api", version: "0.1.0" });
});

const neighborhoodSchema = z.object({
  slug: z.string(),
  name: z.string(),
  borough: z.string(),
  tagline: z.string(),
  description: z.string(),
  priceCents: z.number().int().nonnegative().nullable(),
  items: z.array(z.string()),
  vendors: z.array(
    z.object({
      name: z.string(),
      craft: z.string(),
    }),
  ),
  highlight: z.boolean().optional(),
  badge: z.string().optional(),
});

type NeighborhoodRecord = z.infer<typeof neighborhoodSchema>;

const neighborhoods: NeighborhoodRecord[] = [
  {
    slug: "long-island-city",
    name: "The Best of Long Island City",
    borough: "Queens",
    tagline: "Sourdough, cold brew & Brooklyn-roasted comfort.",
    description: "A pilot box from the LIC waterfront featuring breads, bagels, and pantry makers.",
    priceCents: 7200,
    badge: "Pilot Neighborhood",
    highlight: true,
    items: [],
    vendors: [
      { name: "Hunters Point Bakery", craft: "Sourdough & country breads" },
      { name: "5 Borough Bagel Co.", craft: "Hand-rolled bagels" },
    ],
  },
  {
    slug: "west-village",
    name: "West Village Essentials",
    borough: "Manhattan",
    tagline: "Croissants, brie, charcuterie — a Sunday morning, boxed.",
    description: "A brunch-forward box with viennoiserie, cheese, charcuterie, and preserves.",
    priceCents: 7600,
    items: [],
    vendors: [
      { name: "Rue Perry", craft: "French viennoiserie" },
      { name: "The Cheese Counter", craft: "Affineur & cheesemonger" },
    ],
  },
  {
    slug: "astoria",
    name: "The Best of Astoria",
    borough: "Queens",
    tagline: "Phyllo, honey & olives from 30th Avenue.",
    description: "A walk down 30th Avenue with Greek and Levantine specialties.",
    priceCents: 7000,
    items: [],
    vendors: [
      { name: "Athena Sweets", craft: "Greek pastries" },
      { name: "30th Ave Bakery", craft: "Pita & flatbreads" },
    ],
  },
  {
    slug: "lower-east-side",
    name: "Lower East Side Classics",
    borough: "Manhattan",
    tagline: "Black-and-white cookies, knishes & a Sunday babka.",
    description: "Classic deli staples and pastries from the Lower East Side.",
    priceCents: 7400,
    items: [],
    vendors: [
      { name: "Orchard St. Bakeshop", craft: "Bagels & bialys" },
      { name: "Rivington Knish Co.", craft: "Knishes & savory pastries" },
    ],
  },
];

const neighborhoodsQuerySchema = z.object({
  q: z.string().optional().default(""),
  borough: z.string().optional().default("all"),
  sort: z.enum(["featured", "name-asc", "name-desc"]).optional().default("featured"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(24).optional().default(6),
});

app.get("/neighborhoods", async (request) => {
  const query = neighborhoodsQuerySchema.parse(request.query ?? {});
  const normalizedQuery = query.q.trim().toLowerCase();

  const filtered = neighborhoods.filter((neighborhood) => {
    if (query.borough !== "all" && neighborhood.borough !== query.borough) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchable = [
      neighborhood.name,
      neighborhood.borough,
      neighborhood.tagline,
      neighborhood.description,
      ...neighborhood.items,
      ...neighborhood.vendors.map((vendor) => `${vendor.name} ${vendor.craft}`),
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });

  const sorted = [...filtered].sort((left, right) => {
    if (query.sort === "name-asc") {
      return left.name.localeCompare(right.name);
    }

    if (query.sort === "name-desc") {
      return right.name.localeCompare(left.name);
    }

    if (left.highlight === right.highlight) {
      return left.name.localeCompare(right.name);
    }

    return left.highlight ? -1 : 1;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const items = sorted.slice(start, start + query.pageSize).map((item) => neighborhoodSchema.parse(item));

  return {
    items,
    total,
    page,
    pageSize: query.pageSize,
    totalPages,
  };
});

const port = Number(process.env.PORT ?? 4000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`API listening on ${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
