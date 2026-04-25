import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — Neighborhood Tasting Menu",
  description:
    "Get in touch with the Neighborhood Tasting Menu team — delivery zones, vendor partnerships, and customer support.",
  openGraph: {
    title: "Contact — Neighborhood Tasting Menu",
    description:
      "Reach the Neighborhood Tasting Menu team for support, vendor partnerships, and delivery questions.",
  },
};

export default function ContactPage() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:px-10 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand md:text-5xl">
            We&apos;d love to hear from you.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-foreground/70">
            Questions about delivery zones, your subscription, or partnering as a vendor — drop us a
            note and we&apos;ll be back within one business day.
          </p>

          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-foreground">hello@tastingmenu.nyc</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Pilot zones
              </dt>
              <dd className="mt-1 text-foreground">
                LIC, Astoria, West Village, Lower East Side, Williamsburg, DUMBO
              </dd>
            </div>
          </dl>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
