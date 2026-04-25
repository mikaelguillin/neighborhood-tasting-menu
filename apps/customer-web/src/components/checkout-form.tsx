"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlanOption, PlanId } from "@/lib/catalog-types";

type PlanChoice = { id: PlanId; label: string; priceCents: number };
type PaymentMethod = "card" | "apple_pay" | "cash";

type ProfileResponse = {
  defaultAddress: string | null;
};

type CheckoutFormProps = {
  defaultPlan?: PlanId | null;
};

function centsToMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

function formatDeliveryDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function CheckoutForm({ defaultPlan = null }: CheckoutFormProps) {
  const router = useRouter();
  const [planOptions, setPlanOptions] = useState<PlanChoice[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const [planId, setPlanId] = useState<PlanId | "">("");
  const [promoCode, setPromoCode] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        const response = await fetch("/api/plans");
        const payload = (await response.json().catch(() => null)) as {
          items?: PlanOption[];
        } | null;
        if (!response.ok || !payload?.items || cancelled) return;

        const options = payload.items.map((plan) => ({
          id: plan.id,
          label: plan.name,
          priceCents: plan.priceCents,
        }));
        setPlanOptions(options);
        const defaultExists = defaultPlan
          ? options.some((option) => option.id === defaultPlan)
          : false;
        setPlanId(
          defaultExists ? (defaultPlan as PlanId) : (options[0]?.id ?? ""),
        );
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, [defaultPlan]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (cancelled) return;

        if (response.status === 401) {
          setNeedsSignIn(true);
          return;
        }
        if (!response.ok) return;

        const payload = (await response
          .json()
          .catch(() => null)) as ProfileResponse | null;
        if (cancelled || !payload?.defaultAddress) return;
        setAddress((current) =>
          current.trim().length === 0
            ? (payload.defaultAddress ?? "")
            : current,
        );
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlan =
    planOptions.find((option) => option.id === planId) ?? planOptions[0];
  const basePriceCents = selectedPlan?.priceCents ?? 0;
  const deliveryFeeCents = 0;
  const serviceFeeCents = 400;
  const discountCents =
    promoCode.trim().toUpperCase() === "WELCOME10"
      ? Math.round(basePriceCents * 0.1)
      : 0;
  const totalCents =
    basePriceCents + deliveryFeeCents + serviceFeeCents - discountCents;

  const ready = useMemo(
    () =>
      address.trim().length > 8 &&
      deliveryWindow.trim().length > 3 &&
      !!paymentMethod &&
      !submitting &&
      !plansLoading &&
      !profileLoading &&
      !!selectedPlan,
    [
      address,
      deliveryWindow,
      paymentMethod,
      submitting,
      plansLoading,
      profileLoading,
      selectedPlan,
    ],
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
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (response.status === 401) {
          setNeedsSignIn(true);
        }
        throw new Error(payload?.error ?? "Checkout failed");
      }

      const order = (await response.json()) as { id: string };
      router.push(`/orders/${order.id}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Checkout failed";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]"
    >
      <div className="space-y-5 rounded-[14px] bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-semibold tracking-tight text-brand">
          Delivery details
        </h2>
        {needsSignIn && (
          <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
            Sign in is required to place your order.{" "}
            <Link href="/sign-in" className="font-semibold underline">
              Go to sign in
            </Link>
            .
          </div>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground/80">Plan</span>
          <Select
            value={planId}
            onValueChange={(value: PlanId) => setPlanId(value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planOptions.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.label} ({centsToMoney(plan.priceCents)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground/80">
            Delivery address
          </span>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="h-10"
            placeholder="Street, city, state"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground/80">
            Delivery window
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full justify-start text-left font-normal"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {deliveryDate ? (
                  formatDeliveryDate(deliveryDate)
                ) : (
                  <span className="text-muted-foreground">
                    Select a delivery date
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deliveryDate}
                onSelect={(date) => {
                  setDeliveryDate(date);
                  setDeliveryWindow(
                    date ? `${formatDeliveryDate(date)} 4:00 PM - 7:00 PM` : "",
                  );
                }}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground/80">
            Payment method
          </span>
          <Select
            value={paymentMethod}
            onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Choose a payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="apple_pay">Apple Pay</SelectItem>
              <SelectItem value="cash">Cash on delivery</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground/80">
            Promo code (optional)
          </span>
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
        <h2 className="text-xl font-semibold tracking-tight text-brand">
          Order summary
        </h2>
        <p className="mt-2 text-sm text-foreground/70">
          {plansLoading || profileLoading
            ? "Loading checkout..."
            : (selectedPlan?.label ?? "No plans available")}
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-foreground/70">Subtotal</dt>
            <dd>{centsToMoney(basePriceCents)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-foreground/70">Delivery</dt>
            <dd>
              {deliveryFeeCents === 0 ? "Free" : centsToMoney(deliveryFeeCents)}
            </dd>
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
