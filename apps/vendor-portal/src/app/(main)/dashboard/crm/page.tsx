import { KpiCards } from "./_components/kpi-cards";
import { OpportunitiesSection } from "./_components/opportunities-section";
import { PipelineActivity } from "./_components/pipeline-activity";
import { TaskReminders } from "./_components/task-reminders";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <section className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Vendor Profile</h1>
        <p className="text-muted-foreground text-sm">
          Keep your public business profile accurate for customers and staff.
        </p>
      </section>
      <KpiCards />
      <PipelineActivity />
      <TaskReminders />
      <OpportunitiesSection />
    </div>
  );
}
