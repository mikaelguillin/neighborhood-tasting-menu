import type { Metadata } from "next";
import { OrderTimeline } from "@/components/order-timeline";

export const metadata: Metadata = {
  title: "Order details - Neighborhood Tasting Menu",
  description: "Review a single order timeline and fulfillment progress.",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-[900px] px-4 pb-20 pt-12 md:px-6 lg:px-10 lg:pt-16">
        <OrderTimeline orderId={id} />
      </div>
    </section>
  );
}
