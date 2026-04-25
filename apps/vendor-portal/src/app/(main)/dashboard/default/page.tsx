import { MetricCards } from "./_components/metric-cards";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <section className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm">
          Track incoming orders, monitor fulfillment health, and keep service moving.
        </p>
      </section>
      <MetricCards />
      <PerformanceOverview />
      <SubscriberOverview />
    </div>
  );
}
