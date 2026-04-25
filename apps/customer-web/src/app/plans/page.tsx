import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPlans } from "@/lib/catalog-store";
import type { PlanOption } from "@/lib/catalog-types";

export const metadata: Metadata = {
  title: "Plans & pricing — Neighborhood Tasting Menu",
  description:
    "Pick a weekly or every-other-week NYC tasting box. Pause, skip, or cancel any time. First delivery ships free.",
  openGraph: {
    title: "Plans & pricing — Neighborhood Tasting Menu",
    description: "Weekly and bi-weekly tasting box subscriptions. Pause or skip any week.",
  },
};

function centsToMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export default async function PlansPage() {
  const plans: PlanOption[] = await listPlans();
  return (
    <>
      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-14 pb-8 text-center md:px-6 lg:px-10 lg:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Plans & pricing
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-brand md:text-5xl">
            Pick the rhythm that fits your week.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-foreground/70">
            All plans include free delivery in our NYC pilot zones, full control to skip or pause,
            and zero commitment beyond the next box.
          </p>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-4 md:px-6 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={
                  "relative flex flex-col rounded-[16px] bg-card p-7 shadow-[var(--shadow-card)] " +
                  (p.featured ? "ring-2 ring-primary/70 lg:scale-[1.02]" : "")
                }
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                    Most loved
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {p.cadence}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand">{p.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{p.blurb}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    {centsToMoney(p.priceCents)}
                  </span>
                  <span className="text-sm text-foreground/60">/box</span>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint text-brand">
                        <Check className="h-3 w-3" />
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <Button
                    asChild
                    size="lg"
                    variant={p.featured ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href={`/checkout?plan=${p.id}`}>Choose {p.name}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-house text-house-foreground">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-8 px-4 py-14 md:px-6 lg:grid-cols-[1.5fr_1fr] lg:gap-16 lg:px-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-card md:text-3xl">
              Not sure yet?{" "}
              <span className="font-editorial italic">Try a single box, no subscription.</span>
            </h2>
            <p className="mt-3 max-w-xl text-house-foreground/75">
              Order any neighborhood box one-time. If you love it, we&apos;ll roll you into a
              subscription with the second box on us.
            </p>
          </div>
          <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
            <Button variant="inverted" size="lg" asChild>
              <Link href="/neighborhoods">Browse one-time boxes</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
