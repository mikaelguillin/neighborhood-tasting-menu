import type { Metadata } from "next";
import Link from "next/link";
import { Box, Leaf, MapPin, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works — Neighborhood Tasting Menu",
  description:
    "Behind the box: how we curate one NYC micro-neighborhood each week, batch deliveries by building, and partner with local makers without commission games.",
  openGraph: {
    title: "How it works — Neighborhood Tasting Menu",
    description:
      "Behind the box: hyper-local curation, hub-and-spoke delivery, and a fair vendor model.",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-14 pb-10 md:px-6 lg:px-10 lg:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            How it works
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-brand md:text-5xl">
            Hyper-local curation,{" "}
            <span className="font-editorial italic text-foreground">hub-and-spoke delivery.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/70">
            Most food delivery makes you choose: cheap on-demand, or expensive curation. We do
            neither. Each week we pick one NYC micro-neighborhood, partner with the makers there,
            and deliver building-by-building so it&apos;s affordable, fresh, and lighter on the
            city.
          </p>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10 lg:py-20">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPin,
                title: "We pick the neighborhood",
                body: "Each Monday we publish that week's drop — a single micro-neighborhood with five to seven exclusive items.",
              },
              {
                icon: Users,
                title: "We pre-order from makers",
                body: "Vendors get firm volumes by Tuesday, so they bake exactly what's needed. No commission games, no shrink.",
              },
              {
                icon: Box,
                title: "We pack by hand",
                body: "Thursday afternoon we hand-pack each box with a printed maker card and a delivery window.",
              },
              {
                icon: Truck,
                title: "We route by building",
                body: "Friday we batch by zip code and high-rise to keep delivery costs and emissions low.",
              },
            ].map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-[12px] bg-canvas p-6 shadow-[var(--shadow-card)]">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Step 0{i + 1}
                </span>
                <span className="mt-3 grid h-11 w-11 place-items-center rounded-full bg-mint text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-brand">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Why hub-and-spoke
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Density is the trick.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-foreground/75">
              By concentrating deliveries in specific NYC high-rises and zip codes, our drivers can
              fulfill 30+ boxes per hour instead of 3. That keeps the price honest, makes free
              delivery viable, and cuts the per-box carbon footprint by an estimated 70% versus
              on-demand.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Stat icon={Truck} label="Per-box carbon vs. on-demand" value="−70%" />
            <Stat icon={Leaf} label="Vendor shrink reduction" value="−45%" />
            <Stat icon={MapPin} label="NYC pilot zones" value="6 zips" />
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 md:px-6 lg:px-10">
          <div className="rounded-[20px] bg-card p-8 text-center shadow-[var(--shadow-card)] md:p-14">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-brand md:text-4xl">
              Ready to taste this Friday?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-foreground/70">
              Subscriptions open weekly until Wednesday at midnight. The first box always ships
              free.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/plans">See the plans</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/neighborhoods">Browse neighborhoods</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[12px] bg-card p-5 shadow-[var(--shadow-card)]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mint text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-brand">{value}</p>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
