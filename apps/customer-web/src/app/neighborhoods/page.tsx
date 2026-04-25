import type { Metadata } from "next";
import { NeighborhoodCard } from "@/components/neighborhood-card";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

export const metadata: Metadata = {
  title: "Neighborhoods — Neighborhood Tasting Menu",
  description:
    "Browse this season's New York micro-neighborhood tasting boxes — Long Island City, the West Village, Astoria, and the Lower East Side.",
  openGraph: {
    title: "Neighborhoods — Neighborhood Tasting Menu",
    description: "Browse this season's New York micro-neighborhood tasting boxes.",
  },
};

export default function NeighborhoodsPage() {
  return (
    <>
      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-14 pb-6 md:px-6 lg:px-10 lg:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            This season&apos;s rotation
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-brand md:text-5xl">
            One block at a time, the whole city.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/70">
            Each box is curated around a specific NYC micro-neighborhood and features five to seven
            exclusive items from makers within a few blocks of one another. Subscribe to all of
            them, or pick the ones that taste like home.
          </p>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-8 md:px-6 lg:px-10 lg:pb-28">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {NEIGHBORHOODS.map((n) => (
              <NeighborhoodCard key={n.slug} n={n} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
