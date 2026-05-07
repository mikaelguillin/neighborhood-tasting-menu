"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Neighborhood, PlanId, PlanOption } from "@ntm/types";
import { planOptionToCheckoutPlan } from "@/lib/checkout-types";
import type { StructuredCheckoutAddress } from "@/lib/checkout-types";
import { CheckoutProvider, useCheckout } from "./checkout-context";
import { CheckoutStepper } from "./checkout-stepper";
import { OrderSummary } from "./order-summary";
import { StepPlan } from "./steps/step-plan";
import { StepAddress } from "./steps/step-address";
import { StepDelivery } from "./steps/step-delivery";
import { StepPayment } from "./steps/step-payment";
import { CheckoutConfirmation } from "./checkout-confirmation";

function toPlanId(value: string | null, valid: Set<PlanId>): PlanId | null {
  if (!value) return null;
  return valid.has(value as PlanId) ? (value as PlanId) : null;
}

function CheckoutStepsInner() {
  const { step } = useCheckout();

  if (step === "confirmation") {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 py-16 md:px-6 lg:px-10 lg:py-24">
        <CheckoutConfirmation />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1100px] px-4 pt-12 md:px-6 lg:px-10 lg:pt-16">
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
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 pt-8 md:px-6 lg:px-10">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-6 md:px-6 lg:px-10">
        <div className="rounded-[16px] bg-card/60 p-4 shadow-[var(--shadow-card)] md:p-5">
          <CheckoutStepper />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <details className="mb-6 rounded-[12px] bg-card p-4 shadow-[var(--shadow-card)] lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                Order summary
              </summary>
              <div className="mt-4">
                <OrderSummary compact />
              </div>
            </details>

            {step === "plan" && <StepPlan />}
            {step === "address" && <StepAddress />}
            {step === "delivery" && <StepDelivery />}
            {step === "payment" && <StepPayment />}
          </div>

          <div className="hidden lg:block">
            <OrderSummary />
          </div>
        </div>
      </div>
    </>
  );
}

export function CheckoutFlow() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [profile, setProfile] = useState<{
    fullName: string | null;
    phone: string | null;
    defaultAddress: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [plansRes, hoodRes, profileRes] = await Promise.all([
          fetch("/api/plans"),
          fetch("/api/neighborhoods?sort=featured&borough=all&pageSize=100&page=1"),
          fetch("/api/profile"),
        ]);

        const plansPayload = (await plansRes.json().catch(() => null)) as {
          items?: PlanOption[];
        } | null;
        const hoodPayload = (await hoodRes.json().catch(() => null)) as {
          items?: Neighborhood[];
        } | null;

        if (!cancelled && plansPayload?.items) {
          setPlans(plansPayload.items);
        }
        if (!cancelled && hoodPayload?.items) {
          setNeighborhoods(hoodPayload.items);
        }
        if (!cancelled && profileRes.ok) {
          const p = (await profileRes.json().catch(() => null)) as {
            fullName?: string | null;
            phone?: string | null;
            defaultAddress?: string | null;
          } | null;
          if (p) {
            setProfile({
              fullName: p.fullName ?? null,
              phone: p.phone ?? null,
              defaultAddress: p.defaultAddress ?? null,
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkoutPlans = useMemo(() => plans.map(planOptionToCheckoutPlan), [plans]);

  const validPlanIds = useMemo(() => new Set(plans.map((p) => p.id)), [plans]);

  const defaults = useMemo(() => {
    const planParam = searchParams.get("plan");
    const neighborhoodParam = searchParams.get("neighborhood");
    const modeParam = searchParams.get("mode");

    const initialPlanId =
      toPlanId(planParam, validPlanIds) ?? plans[0]?.id ?? ("weekly" as PlanId);

    const slugs = new Set(neighborhoods.map((n) => n.slug));
    const initialNeighborhoodSlug =
      (neighborhoodParam && slugs.has(neighborhoodParam)
        ? neighborhoodParam
        : neighborhoods[0]?.slug) ?? "";

    const initialMode: "subscription" | "onetime" =
      modeParam === "onetime" || modeParam === "subscription" ? modeParam : "subscription";

    const initialAddress: Partial<StructuredCheckoutAddress> = {};
    if (profile?.fullName) initialAddress.fullName = profile.fullName;
    if (profile?.phone) initialAddress.phone = profile.phone;
    if (profile?.defaultAddress) initialAddress.street = profile.defaultAddress;

    return {
      initialPlanId,
      initialNeighborhoodSlug,
      initialMode,
      initialAddress,
    };
  }, [searchParams, plans, neighborhoods, validPlanIds, profile]);

  if (loading || checkoutPlans.length === 0 || neighborhoods.length === 0) {
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
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading checkout…</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-canvas">
      <CheckoutProvider
        plans={checkoutPlans}
        neighborhoods={neighborhoods}
        initialPlanId={defaults.initialPlanId}
        initialNeighborhoodSlug={defaults.initialNeighborhoodSlug}
        initialMode={defaults.initialMode}
        initialAddress={defaults.initialAddress}
      >
        <CheckoutStepsInner />
      </CheckoutProvider>
    </section>
  );
}
