import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-house text-house-foreground">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-full bg-card text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M3 7h18l-1.5 11a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 7Z" />
                  <path d="M8 7V5a4 4 0 0 1 8 0v2" />
                </svg>
              </span>
              <span className="font-semibold tracking-tight">Neighborhood Tasting Menu</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-house-foreground/70">
              A weekly box from one New York neighborhood at a time. Curated by hand, sourced from
              makers within a few city blocks of one another.
            </p>
          </div>

          <FooterCol
            title="Explore"
            links={[
              { href: "/neighborhoods", label: "Neighborhoods" },
              { href: "/how-it-works", label: "How it works" },
              { href: "/plans", label: "Plans & pricing" },
            ]}
          />
          <FooterCol
            title="Vendors"
            links={[
              { href: "/vendors", label: "Become a vendor" },
              { href: "/vendors", label: "Maker stories" },
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              { href: "/contact", label: "Contact us" },
              { href: "/contact", label: "Delivery zones" },
              { href: "/contact", label: "Pause or cancel" },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-house-foreground/15 pt-6 text-xs text-house-foreground/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Neighborhood Tasting Menu. Crafted in New York City.</p>
          <div className="flex items-center gap-5">
            <Link href="/contact" className="hover:text-card">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-card">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-card">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-house-foreground/60">
        {title}
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((l, i) => (
          <li key={i}>
            <Link href={l.href} className="text-house-foreground/85 hover:text-card">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
