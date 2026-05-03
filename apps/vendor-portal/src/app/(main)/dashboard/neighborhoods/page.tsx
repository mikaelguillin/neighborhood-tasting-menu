import { NeighborhoodsManager } from "./_components/neighborhoods-manager";

export default function NeighborhoodsPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <section className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Neighborhoods</h1>
        <p className="text-muted-foreground text-sm">
          Assign or unassign your vendor to curated NYC neighborhoods across the five boroughs.
        </p>
      </section>
      <NeighborhoodsManager />
    </div>
  );
}
