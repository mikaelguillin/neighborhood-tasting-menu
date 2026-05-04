"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckout } from "../checkout-context";
import { cn } from "@/lib/utils";

export function StepPlan() {
  const { plan, plans, neighborhoodSlug, neighborhoods, setPlan, setNeighborhood, next } =
    useCheckout();

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-brand md:text-3xl">
        Pick your plan.
      </h2>
      <p className="mt-2 text-sm text-foreground/70">Change cadence any time. First delivery is free.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const selected = p.slug === plan.slug;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => setPlan(p.slug)}
              aria-pressed={selected}
              className={cn(
                "relative flex flex-col rounded-[14px] bg-card p-5 text-left shadow-[var(--shadow-card)] transition-all",
                selected
                  ? "ring-2 ring-primary"
                  : "hover:-translate-y-0.5 hover:shadow-md",
              )}
            >
              {p.featured && (
                <span className="absolute -top-2.5 left-4 rounded-pill bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                  Most loved
                </span>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {p.cadence}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-brand">{p.name}</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {p.priceLabel}
                </span>
                <span className="text-xs text-foreground/60">/box</span>
              </p>
              <ul className="mt-3 space-y-1.5">
                {p.perks.slice(0, 3).map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-1.5 text-xs text-foreground/75"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
              {selected && (
                <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-pill bg-mint px-2.5 py-1 text-[11px] font-semibold text-brand">
                  <Check className="h-3 w-3" /> Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold tracking-tight text-brand">
          Choose your starting neighborhood.
        </h3>
        <p className="mt-1 text-sm text-foreground/70">
          You&apos;ll get a different one each {plan.slug === "sampler" ? "other " : ""}
          week after this.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {neighborhoods.map((n) => {
            const selected = n.slug === neighborhoodSlug;
            return (
              <button
                key={n.slug}
                type="button"
                onClick={() => setNeighborhood(n.slug)}
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] bg-card p-3 text-left shadow-[var(--shadow-card)] transition-all",
                  selected
                    ? "ring-2 ring-primary"
                    : "hover:-translate-y-0.5 hover:shadow-md",
                )}
              >
                <img
                  src={n.image}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-[8px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {n.borough}
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">{n.name}</p>
                  <p className="truncate text-xs text-foreground/60">{n.tagline}</p>
                </div>
                {selected && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button size="lg" onClick={next}>
          Continue to address
        </Button>
      </div>
    </div>
  );
}
