"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PlanId = "sampler" | "weekly" | "local-hero";

const PLAN_OPTIONS: { id: PlanId; label: string; priceCents: number }[] = [
  { id: "sampler", label: "The Sampler", priceCents: 5800 },
  { id: "weekly", label: "The Weekly", priceCents: 7200 },
  { id: "local-hero", label: "The Local Hero", priceCents: 11800 },
];

function centsToMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

export function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const defaultPlan = (params.get("plan") as PlanId) || "weekly";

  const [planId, setPlanId] = useState<PlanId>(
    PLAN_OPTIONS.some((option) => option.id === defaultPlan) ? defaultPlan : "weekly",
  );
  const [promoCode, setPromoCode] = useState("");
  const [address, setAddress] = useState("50-25 Center Blvd, Long Island City, NY");
  const [deliveryWindow, setDeliveryWindow] = useState("Friday 4:00 PM - 7:00 PM");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = PLAN_OPTIONS.find((option) => option.id === planId) ?? PLAN_OPTIONS[1];
  const deliveryFeeCents = 0;
  const serviceFeeCents = 400;
  const discountCents = promoCode.trim().toUpperCase() === "WELCOME10" ? Math.round(selectedPlan.priceCents * 0.1) : 0;
  const totalCents = selectedPlan.priceCents + deliveryFeeCents + serviceFeeCents - discountCents;

  const ready = useMemo(
    () => address.trim().length > 8 && deliveryWindow.trim().length > 3 && !submitting,
    [address, deliveryWindow, submitting],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          promoCode: promoCode.trim() || undefined,
          address: address.trim(),
          deliveryWindow: deliveryWindow.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Checkout failed");
      }

      const order = (await response.json()) as { id: string };
      router.push(`/orders/${order.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Checkout failed";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5 rounded-[14px] bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-semibold tracking-tight text-brand">Delivery details</h2>

        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground/80">Plan</span>
          <Select value={planId} onValueChange={(value: PlanId) => setPlanId(value)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_OPTIONS.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.label} ({centsToMoney(plan.priceCents)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground/80">Delivery address</span>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="h-10"
            placeholder="Street, city, state"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground/80">Delivery window</span>
          <Input
            value={deliveryWindow}
            onChange={(event) => setDeliveryWindow(event.target.value)}
            className="h-10"
            placeholder="Friday 4:00 PM - 7:00 PM"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground/80">Promo code (optional)</span>
          <Input
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            className="h-10 uppercase"
            placeholder="Enter promo code"
          />
        </label>

        {error && (
          <div className="rounded-[10px] border border-destructive/30 bg-destructive/5 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}
      </div>

      <aside className="h-fit rounded-[14px] bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold tracking-tight text-brand">Order summary</h2>
        <p className="mt-2 text-sm text-foreground/70">{selectedPlan.label}</p>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-foreground/70">Subtotal</dt>
            <dd>{centsToMoney(selectedPlan.priceCents)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-foreground/70">Delivery</dt>
            <dd>{deliveryFeeCents === 0 ? "Free" : centsToMoney(deliveryFeeCents)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-foreground/70">Service fee</dt>
            <dd>{centsToMoney(serviceFeeCents)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-foreground/70">Discount</dt>
            <dd>-{centsToMoney(discountCents)}</dd>
          </div>
          <div className="border-t border-border pt-3" />
          <div className="flex items-center justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{centsToMoney(totalCents)}</dd>
          </div>
        </dl>

        <Button type="submit" className="mt-6 w-full" disabled={!ready}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Placing order...
            </>
          ) : (
            "Place order"
          )}
        </Button>
        <Button type="button" variant="outline" className="mt-3 w-full" asChild>
          <Link href="/orders">View orders timeline</Link>
        </Button>
      </aside>
    </form>
  );
}
