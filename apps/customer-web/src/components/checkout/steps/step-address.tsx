"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useCheckout } from "../checkout-context";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

type Errors = Partial<Record<keyof ReturnType<typeof emptyErrors>, string>>;
function emptyErrors() {
  return {
    fullName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  };
}

export function StepAddress() {
  const { address, updateAddress, next, back } = useCheckout();
  const [errors, setErrors] = React.useState<Errors>({});

  function validate(): boolean {
    const e: Errors = {};
    if (!address.fullName.trim()) e.fullName = "Required";
    if (!address.street.trim()) e.street = "Required";
    if (!address.city.trim()) e.city = "Required";
    if (!address.state) e.state = "Required";
    if (!/^\d{5}$/.test(address.zip)) e.zip = "5-digit ZIP";
    if (!/^[\d\s\-+()]{10,}$/.test(address.phone)) e.phone = "Valid phone required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) next();
  }

  return (
    <form onSubmit={onSubmit}>
      <h2 className="text-2xl font-semibold tracking-tight text-brand md:text-3xl">
        Where should we deliver?
      </h2>
      <p className="mt-2 text-sm text-foreground/70">
        We currently deliver in our NYC pilot zones. We&apos;ll confirm coverage from your ZIP.
      </p>

      <div className="mt-6 grid gap-4 rounded-[14px] bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <Field label="Full name" error={errors.fullName}>
          <input
            value={address.fullName}
            onChange={(e) => updateAddress({ fullName: e.target.value })}
            autoComplete="name"
            className={inputCls}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Street address" error={errors.street}>
            <input
              value={address.street}
              onChange={(e) => updateAddress({ street: e.target.value })}
              autoComplete="address-line1"
              className={inputCls}
            />
          </Field>
          <Field label="Apt / suite (optional)">
            <input
              value={address.apt}
              onChange={(e) => updateAddress({ apt: e.target.value })}
              autoComplete="address-line2"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label="City" error={errors.city}>
            <input
              value={address.city}
              onChange={(e) => updateAddress({ city: e.target.value })}
              autoComplete="address-level2"
              className={inputCls}
            />
          </Field>
          <Field label="State" error={errors.state}>
            <select
              value={address.state}
              onChange={(e) => updateAddress({ state: e.target.value })}
              autoComplete="address-level1"
              className={inputCls}
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ZIP" error={errors.zip}>
            <input
              value={address.zip}
              onChange={(e) =>
                updateAddress({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })
              }
              inputMode="numeric"
              autoComplete="postal-code"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Phone (for delivery updates)" error={errors.phone}>
          <input
            value={address.phone}
            onChange={(e) => updateAddress({ phone: e.target.value })}
            type="tel"
            autoComplete="tel"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={back}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Continue to delivery
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
