import type { Metadata } from "next";
import { OrdersList } from "@/components/orders-list";

export const metadata: Metadata = {
  title: "Orders - Neighborhood Tasting Menu",
  description: "Track your order status with a clear timeline from checkout to delivery.",
};

export default function OrdersPage() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-20 pt-12 md:px-6 lg:px-10 lg:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Order timeline</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand md:text-5xl">
          Follow every step of your delivery.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-foreground/70">
          Your order status updates are deterministic and visible from payment through drop-off.
        </p>

        <OrdersList />
      </div>
    </section>
  );
}
