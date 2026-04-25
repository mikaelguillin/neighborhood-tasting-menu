import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import type { PlanId } from "@/lib/catalog-types";

export const metadata: Metadata = {
  title: "Checkout - Neighborhood Tasting Menu",
  description:
    "Complete your box checkout with delivery details, promo placeholder support, and confirmation.",
};

const VALID_PLAN_IDS: PlanId[] = ["sampler", "weekly", "local-hero"];

function toPlanId(value: string | string[] | undefined): PlanId | null {
  if (typeof value !== "string") return null;
  return VALID_PLAN_IDS.includes(value as PlanId) ? (value as PlanId) : null;
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams?: { plan?: string | string[] };
}) {
  const selectedPlanId = toPlanId(searchParams?.plan);

  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-20 pt-12 md:px-6 lg:px-10 lg:pt-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Checkout</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand md:text-5xl">
            Review your box and place your order.
          </h1>
          <p className="mt-4 text-base text-foreground/70">
            Delivery is free in pilot zones. Promo support is available with code{" "}
            <span className="font-semibold text-foreground">WELCOME10</span> for demo purposes.
          </p>
        </div>

        <CheckoutForm defaultPlan={selectedPlanId} />
      </div>
    </section>
  );
}
