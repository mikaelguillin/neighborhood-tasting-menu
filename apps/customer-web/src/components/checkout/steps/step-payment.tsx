"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckout } from "../checkout-context";
import { computeOrderTotals } from "@/lib/order-pricing";

function formatCard(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function StepPayment() {
  const { payment, updatePayment, address, plan, promoCode, back, completeOrder } =
    useCheckout();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = React.useState(false);
  const promoForTotals = promoCode.trim() ? promoCode.trim() : null;
  const { totalCents } = computeOrderTotals(plan.priceCents, promoForTotals);
  const totalLabel = (totalCents / 100).toFixed(2);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const cardDigits = payment.cardNumber.replace(/\s/g, "");
    if (cardDigits.length < 15) e.cardNumber = "Enter a valid card number";
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) e.expiry = "MM/YY";
    if (!/^\d{3,4}$/.test(payment.cvc)) e.cvc = "3–4 digits";
    if (!payment.sameAsDelivery && !/^\d{5}$/.test(payment.zip)) e.zip = "5-digit ZIP";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    setNeedsSignIn(false);
    if (!validate()) return;
    setSubmitting(true);
    const result = await completeOrder();
    setSubmitting(false);
    if (result.ok) return;
    setSubmitError(result.error);
    if (result.needsSignIn) setNeedsSignIn(true);
  }

  return (
    <form onSubmit={onSubmit}>
      <h2 className="text-2xl font-semibold tracking-tight text-brand md:text-3xl">
        Payment details.
      </h2>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground/70">
        <Lock className="h-3.5 w-3.5 text-primary" />
        Demo only — no card will be charged.
      </p>

      {needsSignIn && (
        <div className="mt-4 rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
          Sign in is required to place your order.{" "}
          <Link href="/sign-in" className="font-semibold underline">
            Go to sign in
          </Link>
          .
        </div>
      )}

      <div className="mt-6 grid gap-4 rounded-[14px] bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <Field label="Card number" error={errors.cardNumber}>
          <input
            value={payment.cardNumber}
            onChange={(e) => updatePayment({ cardNumber: formatCard(e.target.value) })}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="cc-number"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expiry" error={errors.expiry}>
            <input
              value={payment.expiry}
              onChange={(e) => updatePayment({ expiry: formatExpiry(e.target.value) })}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              className={inputCls}
            />
          </Field>
          <Field label="CVC" error={errors.cvc}>
            <input
              value={payment.cvc}
              onChange={(e) =>
                updatePayment({ cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder="123"
              inputMode="numeric"
              autoComplete="cc-csc"
              className={inputCls}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={payment.sameAsDelivery}
            onChange={(e) => updatePayment({ sameAsDelivery: e.target.checked })}
            className="h-4 w-4 accent-[color:var(--primary)]"
          />
          Billing ZIP same as delivery ({address.zip || "—"})
        </label>

        {!payment.sameAsDelivery && (
          <Field label="Billing ZIP" error={errors.zip}>
            <input
              value={payment.zip}
              onChange={(e) =>
                updatePayment({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })
              }
              inputMode="numeric"
              autoComplete="postal-code"
              className={inputCls}
            />
          </Field>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        By placing this order you agree to our terms. Your {plan.name} subscription will renew{" "}
        {plan.cadence.toLowerCase()} until you skip, pause, or cancel.
      </p>

      {submitError && !needsSignIn && (
        <p className="mt-3 text-sm font-medium text-destructive">{submitError}</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={back} disabled={submitting}>
          Back
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Placing order…
            </>
          ) : (
            <>Place order — ${totalLabel}</>
          )}
        </Button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-[8px] border border-border bg-canvas px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error && (
        <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>
      )}
    </label>
  );
}
