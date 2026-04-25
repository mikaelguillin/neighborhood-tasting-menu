import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Box, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeighborhoodCard } from "@/components/neighborhood-card";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import heroBox from "@/assets/hero-box.jpg";
import vendorPortrait from "@/assets/vendor-portrait.jpg";
import { imageSrc } from "@/lib/image-src";

export const metadata: Metadata = {
  title: "Neighborhood Tasting Menu — A weekly box from one NYC block",
  description:
    "A curated weekly delivery of artisan goods from one New York neighborhood at a time. Sourdough, pastries, and pantry staples — boxed by hand and dropped to your door.",
  openGraph: {
    title: "Neighborhood Tasting Menu — A weekly NYC artisan box",
    description:
      "One neighborhood, one box, one week. Curated artisan goods from makers within a few city blocks of one another.",
  },
};

export default function HomePage() {
  const featured = NEIGHBORHOODS.slice(0, 4);

  return (
    <>
      <div className="bg-foreground text-card">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:flex-row sm:gap-4 md:px-6 lg:px-10">
          <span className="font-medium">
            New: <span className="font-semibold">The Best of Long Island City</span> drops Friday.
          </span>
          <Link
            href="/neighborhoods/long-island-city"
            className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
          >
            See what&apos;s inside <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <section className="bg-canvas">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10 lg:py-20">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Now delivering in NYC
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-brand md:text-5xl lg:text-[64px]">
              One neighborhood,
              <br />
              <span className="font-editorial italic text-foreground">one box, one week.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/75 md:text-[17px]">
              Every Friday we deliver a curated tasting box from a single New York
              micro-neighborhood — sourdough, pastries, charcuterie and pantry staples from makers
              within a few city blocks of one another.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/plans">
                  Start a subscription <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/neighborhoods">Browse neighborhoods</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-foreground/60">
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Free delivery in pilot zones
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Pause or skip any week
              </span>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[20px] bg-canvas-soft shadow-[0_18px_40px_-20px_rgb(0_0_0_/_0.25)]">
              <img
                src={imageSrc(heroBox)}
                alt="A Neighborhood Tasting Menu box filled with sourdough, croissants, jam and pasta"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-pill bg-card/95 px-4 py-2.5 text-xs font-semibold text-foreground shadow-[var(--shadow-card)] backdrop-blur md:bottom-6 md:left-6 md:right-6">
                <span className="text-brand">This week · LIC Edition</span>
                <span className="text-foreground/60">5 makers · 8 items</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10 lg:py-24">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                How it works
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Curated by hand, dropped to your door.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-foreground/70">
              We focus on a single NYC micro-neighborhood each week, partner with the makers there,
              and route deliveries by building — so it&apos;s greener, fresher, and cheaper than
              on-demand.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Box,
                title: "1. Pick your plan",
                body: "Weekly or every-other-week. Choose a box size, set your address, and tell us about any allergies.",
              },
              {
                icon: MapPin,
                title: "2. We curate the neighborhood",
                body: "Each Monday we publish that week's drop — five to seven exclusive items from makers within a few blocks.",
              },
              {
                icon: Truck,
                title: "3. Friday at your door",
                body: "We batch deliveries by building, so your box arrives chilled, on-time, and with a smaller carbon footprint.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[12px] bg-canvas p-6 shadow-[var(--shadow-card)]">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-mint text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-brand">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10 lg:py-24">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Neighborhood drops
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                This season&apos;s rotation.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/neighborhoods">
                See all neighborhoods <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((n) => (
              <NeighborhoodCard key={n.slug} n={n} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-house text-house-foreground">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-10 lg:py-24">
          <div className="overflow-hidden rounded-[20px]">
            <img
              src={imageSrc(vendorPortrait)}
              alt="An artisan baker holding a fresh sourdough loaf"
              loading="lazy"
              width={1200}
              height={1400}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--gold)]">
              For the makers
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-card md:text-4xl">
              Built around the bakery,{" "}
              <span className="font-editorial italic">not against it.</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-house-foreground/75">
              We pre-order in bulk every Monday so vendors know what to bake. No commission games,
              no surprise refunds — and a portal to manage capacity, ingredients, and delivery
              windows in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="inverted" size="lg" asChild>
                <Link href="/vendors">Become a vendor</Link>
              </Button>
              <Button variant="ghostDark" size="lg" asChild>
                <Link href="/how-it-works">Read the model</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10 lg:py-24">
          <div className="rounded-[20px] bg-card p-8 text-center shadow-[var(--shadow-card)] md:p-14">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-brand md:text-4xl">
              The next neighborhood drops in a few days.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground/70">
              Skip any week, swap your zip, or pause whenever life gets in the way. The first box
              ships free.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/plans">Start a subscription</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
