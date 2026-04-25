import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNeighborhoodBySlug, listNeighborhoodSlugs, listNeighborhoods } from "@/lib/catalog-store";
import { imageSrc } from "@/lib/image-src";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await listNeighborhoodSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = await getNeighborhoodBySlug(slug);
  if (!n) {
    return { title: "Neighborhood not found — Neighborhood Tasting Menu" };
  }
  return {
    title: `${n.name} — Neighborhood Tasting Menu`,
    description: n.description,
    openGraph: {
      title: `${n.name} — Neighborhood Tasting Menu`,
      description: n.description,
      images: [{ url: imageSrc(n.image) }],
    },
    twitter: {
      card: "summary_large_image",
      images: [imageSrc(n.image)],
    },
  };
}

export default async function NeighborhoodDetailPage({ params }: Props) {
  const { slug } = await params;
  const n = await getNeighborhoodBySlug(slug);
  if (!n) notFound();
  const otherNeighborhoods = (
    await listNeighborhoods({ q: "", borough: "all", sort: "featured", page: 1, pageSize: 100 })
  ).items
    .filter((x) => x.slug !== n.slug)
    .slice(0, 3);

  return (
    <>
      <div className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 md:px-6 lg:px-10">
          <Link
            href="/neighborhoods"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> All neighborhoods
          </Link>
        </div>
      </div>

      <section className="bg-canvas">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:py-16">
          <div className="overflow-hidden rounded-[20px] bg-canvas-soft shadow-[0_18px_40px_-22px_rgb(0_0_0_/_0.28)]">
            <img
              src={imageSrc(n.image)}
              alt={`${n.name} tasting box`}
              width={1200}
              height={900}
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>

          <div className="lg:pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {n.borough} · This week&apos;s drop
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand md:text-5xl">
              {n.name}
            </h1>
            <p className="mt-4 font-editorial text-xl italic text-foreground/80">{n.tagline}</p>
            <p className="mt-5 text-base leading-relaxed text-foreground/75">{n.description}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/plans">Subscribe — from $58/box</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/plans">One-time order</Link>
              </Button>
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-3 rounded-[12px] bg-card p-4 shadow-[var(--shadow-card)]">
              <Stat label="Items" value={`${n.items.length}`} />
              <Stat label="Makers" value={`${n.vendors.length}`} />
              <Stat label="Ships" value="Friday" />
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-house text-house-foreground">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:px-10 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--gold)]">
              In the box
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-card md:text-4xl">
              What you&apos;ll taste this week.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-house-foreground/75">
              Five to seven exclusive items, packed by hand on Thursday and dropped to your door
              Friday between 4–9pm.
            </p>
          </div>
          <ul className="space-y-3">
            {n.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-[12px] border border-house-foreground/10 bg-house-foreground/5 p-4"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm leading-relaxed text-card">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            The makers
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Curated from {n.vendors.length} local vendors.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {n.vendors.map((v) => (
              <div key={v.name} className="rounded-[12px] bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {n.borough}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-brand">{v.name}</h3>
                <p className="mt-1.5 text-sm text-foreground/70">{v.craft}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-canvas-soft">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Up next</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Other neighborhoods on the rotation.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherNeighborhoods.map((other) => (
                <Link
                  key={other.slug}
                  href={`/neighborhoods/${other.slug}`}
                  className="group flex items-center gap-4 rounded-[12px] bg-card p-3 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5"
                >
                  <img
                    src={imageSrc(other.image)}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 shrink-0 rounded-[8px] object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {other.borough}
                    </p>
                    <p className="mt-0.5 font-semibold tracking-tight text-brand">{other.name}</p>
                    <p className="mt-0.5 text-xs text-foreground/60">{other.tagline}</p>
                  </div>
                </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight text-brand">{value}</dd>
    </div>
  );
}
