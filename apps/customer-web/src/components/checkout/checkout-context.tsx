"use client";

import * as React from "react";
import type { Neighborhood } from "@ntm/types";
import {
  DELIVERY_WINDOW_LABELS,
  formatStructuredAddress,
  type CheckoutMetadata,
  type CheckoutPlan,
  type StructuredCheckoutAddress,
  type StructuredCheckoutDelivery,
  type DeliveryWindowCode,
} from "@/lib/checkout-types";

export type CheckoutAddress = StructuredCheckoutAddress;
export type CheckoutDelivery = StructuredCheckoutDelivery;
export type DeliveryWindow = DeliveryWindowCode;

export type CheckoutPayment = {
  cardNumber: string;
  expiry: string;
  cvc: string;
  zip: string;
  sameAsDelivery: boolean;
};

export type CheckoutStep = "plan" | "address" | "delivery" | "payment" | "confirmation";

export const STEP_ORDER: CheckoutStep[] = ["plan", "address", "delivery", "payment"];

type State = {
  step: CheckoutStep;
  plans: CheckoutPlan[];
  neighborhoods: Neighborhood[];
  plan: CheckoutPlan;
  neighborhoodSlug: string;
  mode: "subscription" | "onetime";
  address: CheckoutAddress;
  delivery: CheckoutDelivery;
  payment: CheckoutPayment;
  promoCode: string;
  orderNumber: string | null;
};

export type CompleteOrderResult =
  | { ok: true }
  | { ok: false; error: string; needsSignIn?: boolean };

type Ctx = State & {
  setStep: (s: CheckoutStep) => void;
  next: () => void;
  back: () => void;
  setPlan: (slug: CheckoutPlan["slug"]) => void;
  setNeighborhood: (slug: string) => void;
  setPromoCode: (code: string) => void;
  updateAddress: (patch: Partial<CheckoutAddress>) => void;
  updateDelivery: (patch: Partial<CheckoutDelivery>) => void;
  updatePayment: (patch: Partial<CheckoutPayment>) => void;
  completeOrder: () => Promise<CompleteOrderResult>;
};

const CheckoutContext = React.createContext<Ctx | null>(null);

const EMPTY_ADDRESS: CheckoutAddress = {
  fullName: "",
  street: "",
  apt: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
};

const EMPTY_DELIVERY: CheckoutDelivery = {
  window: "fri-evening",
  notes: "",
  isGift: false,
  giftMessage: "",
};

const EMPTY_PAYMENT: CheckoutPayment = {
  cardNumber: "",
  expiry: "",
  cvc: "",
  zip: "",
  sameAsDelivery: true,
};

function pickPlan(plans: CheckoutPlan[], slug: CheckoutPlan["slug"]): CheckoutPlan {
  return plans.find((p) => p.slug === slug) ?? plans[0];
}

export function CheckoutProvider({
  plans,
  neighborhoods,
  initialPlanId,
  initialNeighborhoodSlug,
  initialMode,
  initialAddress,
  children,
}: {
  plans: CheckoutPlan[];
  neighborhoods: Neighborhood[];
  initialPlanId: CheckoutPlan["slug"];
  initialNeighborhoodSlug: string;
  initialMode: "subscription" | "onetime";
  initialAddress?: Partial<CheckoutAddress>;
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<State>(() => ({
    step: "plan",
    plans,
    neighborhoods,
    plan: pickPlan(plans, initialPlanId),
    neighborhoodSlug: initialNeighborhoodSlug,
    mode: initialMode,
    address: { ...EMPTY_ADDRESS, ...initialAddress },
    delivery: EMPTY_DELIVERY,
    payment: EMPTY_PAYMENT,
    promoCode: "",
    orderNumber: null,
  }));

  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    setState((s) => ({
      ...s,
      plans,
      neighborhoods,
      plan: pickPlan(plans, s.plan.slug),
    }));
  }, [plans, neighborhoods]);

  const setStep = React.useCallback((step: CheckoutStep) => {
    setState((s) => ({ ...s, step }));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const next = React.useCallback(() => {
    setState((s) => {
      if (s.step === "payment") return s;
      const i = STEP_ORDER.indexOf(s.step);
      const nextStep = STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)];
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return { ...s, step: nextStep };
    });
  }, []);

  const back = React.useCallback(() => {
    setState((s) => {
      const i = STEP_ORDER.indexOf(s.step);
      if (i <= 0) return s;
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return { ...s, step: STEP_ORDER[i - 1] };
    });
  }, []);

  const setPromoCode = React.useCallback((promoCode: string) => {
    setState((s) => ({ ...s, promoCode }));
  }, []);

  const completeOrder = React.useCallback(async (): Promise<CompleteOrderResult> => {
    const snapshot = stateRef.current;

    const formattedAddress = formatStructuredAddress(snapshot.address);
    const deliveryWindowLabel = DELIVERY_WINDOW_LABELS[snapshot.delivery.window];

    const checkoutMetadata: CheckoutMetadata = {
      neighborhoodSlug: snapshot.neighborhoodSlug,
      checkoutMode: snapshot.mode,
      address: snapshot.address,
      delivery: snapshot.delivery,
      paymentMeta: {
        sameAsDelivery: snapshot.payment.sameAsDelivery,
        billingZip: snapshot.payment.sameAsDelivery
          ? undefined
          : snapshot.payment.zip.trim() || undefined,
      },
    };

    const body = {
      planId: snapshot.plan.slug,
      promoCode: snapshot.promoCode.trim() || undefined,
      address: formattedAddress,
      deliveryWindow: deliveryWindowLabel,
      paymentMethod: "card" as const,
      checkoutMetadata,
    };

    let response: Response;
    try {
      response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: "Network error — try again." };
    }

    if (response.status === 401) {
      return { ok: false, error: "Sign in is required to place your order.", needsSignIn: true };
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: payload?.error ?? "Checkout failed" };
    }

    const data = (await response.json()) as { id: string };
    setState((s) => ({
      ...s,
      step: "confirmation",
      orderNumber: data.id,
    }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    return { ok: true };
  }, []);

  const value: Ctx = {
    ...state,
    setStep,
    next,
    back,
    setPlan: (slug) =>
      setState((s) => ({
        ...s,
        plan: pickPlan(s.plans, slug),
      })),
    setNeighborhood: (slug) => setState((s) => ({ ...s, neighborhoodSlug: slug })),
    setPromoCode,
    updateAddress: (patch) =>
      setState((s) => ({ ...s, address: { ...s.address, ...patch } })),
    updateDelivery: (patch) =>
      setState((s) => ({ ...s, delivery: { ...s.delivery, ...patch } })),
    updatePayment: (patch) =>
      setState((s) => ({ ...s, payment: { ...s.payment, ...patch } })),
    completeOrder,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const ctx = React.useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used inside <CheckoutProvider>");
  return ctx;
}
