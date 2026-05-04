"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Check, Mail, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckout } from "./checkout-context";
import { formatFriendlyDate, getNextFriday } from "@/lib/dates";

export function CheckoutConfirmation() {
  const { orderNumber, plan, neighborhoodSlug, address, neighborhoods } = useCheckout();
  const neighborhood = neighborhoods.find((n) => n.slug === neighborhoodSlug);
  const ship = formatFriendlyDate(getNextFriday());

  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint text-brand">
        <Check className="h-7 w-7" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Order confirmed
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand md:text-4xl">
        You&apos;re in. Welcome to the round.
      </h1>
      <p className="mt-3 text-sm text-foreground/70">
        Order <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
        {" — "}we just sent a receipt to {address.fullName || "you"}.
      </p>

      <div className="mt-8 rounded-[16px] bg-card p-6 text-left shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          {neighborhood && (
            <img
              src={neighborhood.image}
              alt=""
              className="h-20 w-20 shrink-0 rounded-[10px] object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {plan.name} · {plan.cadence}
            </p>
            <p className="mt-1 truncate text-base font-semibold text-foreground">
              First box: {neighborhood?.name ?? "—"}
            </p>
            <p className="text-sm text-foreground/60">Ships {ship}</p>
          </div>
        </div>
      </div>

      <ul className="mt-8 grid gap-3 text-left sm:grid-cols-3">
        <NextStep
          icon={<Mail className="h-4 w-4" />}
          title="Check your inbox"
          body="Receipt + a peek at this week's makers."
        />
        <NextStep
          icon={<Truck className="h-4 w-4" />}
          title="Tracking on Friday"
          body="We'll text the night before with an ETA."
        />
        <NextStep
          icon={<Calendar className="h-4 w-4" />}
          title="Skip any week"
          body="Manage from your account before Wednesday."
        />
      </ul>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/orders">View orders</Link>
        </Button>
      </div>
    </div>
  );
}

function NextStep({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-[12px] bg-card p-4 shadow-[var(--shadow-card)]">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-mint text-brand">
        {icon}
      </span>
      <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">{body}</p>
    </li>
  );
}
