import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Neighborhood } from "@/data/neighborhoods";
import { imageSrc } from "@/lib/image-src";

export function NeighborhoodCard({ n }: { n: Neighborhood }) {
  return (
    <Link
      href={`/neighborhoods/${n.slug}`}
      className="group block overflow-hidden rounded-[12px] bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_18px_rgb(0_0_0_/_0.10),0_1px_2px_rgb(0_0_0_/_0.08)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-canvas-soft">
        <img
          src={imageSrc(n.image)}
          alt={`${n.name} tasting box`}
          loading="lazy"
          width={1200}
          height={900}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {n.badge && (
          <span className="absolute left-3 top-3 rounded-pill border border-gold bg-card/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--gold)]">
            ★ {n.badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {n.borough}
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-brand">{n.name}</h3>
        <p className="text-sm leading-relaxed text-foreground/70">{n.tagline}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          See what&apos;s inside
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
