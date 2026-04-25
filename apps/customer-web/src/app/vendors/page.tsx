import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import vendorPortrait from "@/assets/vendor-portrait.jpg";
import { imageSrc } from "@/lib/image-src";

export const metadata: Metadata = {
  title: "For vendors — Neighborhood Tasting Menu",
  description:
    "Become a Neighborhood Tasting Menu vendor. Firm pre-orders by Tuesday, no commission games, and a portal to manage capacity and ingredients in one place.",
  openGraph: {
    title: "For vendors — Neighborhood Tasting Menu",
    description: "Firm pre-orders, no commission games, one portal for capacity and ingredients.",
    images: [{ url: imageSrc(vendorPortrait) }],
  },
};

export default function VendorsPage() {
  return (
    <>
      <section className="bg-canvas">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              For makers
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand md:text-5xl">
              Built around the bakery,{" "}
              <span className="font-editorial italic text-foreground">not against it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/75">
              We work with one micro-neighborhood at a time. That means firm pre-orders by Tuesday,
              predictable wholesale volumes, and access to high-rise residential customers
              you&apos;d otherwise never reach.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/contact">Apply to join</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/how-it-works">Read the model</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] shadow-[0_18px_40px_-22px_rgb(0_0_0_/_0.28)]">
            <img
              src={imageSrc(vendorPortrait)}
              alt="A baker holding a fresh sourdough loaf"
              loading="lazy"
              width={1200}
              height={1400}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10 lg:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            What you get.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                t: "Firm volumes by Tuesday",
                b: "We pre-order in bulk. You bake to order, with no surprise refunds and no shrink.",
              },
              {
                t: "Honest revenue split",
                b: "Flat take rate, no commission ladders. Paid weekly, no holdbacks.",
              },
              {
                t: "One portal, less ops",
                b: "Manage capacity, ingredients, and delivery windows in a single dashboard.",
              },
            ].map(({ t, b }) => (
              <div key={t} className="rounded-[12px] bg-canvas p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-lg font-semibold tracking-tight text-brand">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
