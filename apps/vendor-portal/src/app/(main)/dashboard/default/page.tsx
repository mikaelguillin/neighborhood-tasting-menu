import { OpsDashboard } from "./_components/ops-dashboard";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <section className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm">
          Run daily operations with queue priorities, SLA visibility, and inventory controls.
        </p>
      </section>
      <OpsDashboard />
    </div>
  );
}
