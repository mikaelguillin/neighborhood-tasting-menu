import type { PlanId, PlanOption } from "@ntm/types";

/** Delivery slot ids used in checkout UI and persisted on orders. */
export type DeliveryWindowCode = "fri-evening" | "fri-late" | "sat-morning";

export type StructuredCheckoutAddress = {
  fullName: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

export type StructuredCheckoutDelivery = {
  window: DeliveryWindowCode;
  notes: string;
  isGift: boolean;
  giftMessage: string;
};

/** Persisted on `orders.checkout_metadata` — never card PAN/expiry/CVC. */
export type CheckoutMetadata = {
  neighborhoodSlug: string;
  checkoutMode: "subscription" | "onetime";
  address: StructuredCheckoutAddress;
  delivery: StructuredCheckoutDelivery;
  paymentMeta: {
    sameAsDelivery: boolean;
    billingZip?: string;
  };
};

export type CheckoutPlan = {
  slug: PlanId;
  name: string;
  cadence: string;
  /** Whole currency units for display */
  price: number;
  priceCents: number;
  priceLabel: string;
  blurb: string;
  perks: string[];
  featured?: boolean;
};

export function planOptionToCheckoutPlan(option: PlanOption): CheckoutPlan {
  const price = option.priceCents / 100;
  const priceLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return {
    slug: option.id,
    name: option.name,
    cadence: option.cadence,
    price,
    priceCents: option.priceCents,
    priceLabel,
    blurb: option.blurb,
    perks: option.perks,
    featured: option.featured,
  };
}

export const DELIVERY_WINDOW_LABELS: Record<DeliveryWindowCode, string> = {
  "fri-evening": "Friday, 4–6pm",
  "fri-late": "Friday, 6–9pm",
  "sat-morning": "Saturday, 9am–12pm",
};

export function formatStructuredAddress(a: StructuredCheckoutAddress): string {
  const line2 = [a.street, a.apt].filter((x) => x.trim().length > 0).join(", ");
  const line3 = [a.city, a.state, a.zip].filter((x) => x.trim().length > 0).join(", ");
  return [a.fullName, line2, line3, a.phone].filter((x) => x.trim().length > 0).join("\n");
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

const WINDOW_SET = new Set<DeliveryWindowCode>(["fri-evening", "fri-late", "sat-morning"]);

export function parseCheckoutMetadata(value: unknown): CheckoutMetadata | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const neighborhoodSlug = o.neighborhoodSlug;
  const checkoutMode = o.checkoutMode;
  if (!isNonEmptyString(neighborhoodSlug)) return null;
  if (checkoutMode !== "subscription" && checkoutMode !== "onetime") return null;

  const addr = o.address;
  if (!addr || typeof addr !== "object") return null;
  const a = addr as Record<string, unknown>;
  const address: StructuredCheckoutAddress = {
    fullName: typeof a.fullName === "string" ? a.fullName : "",
    street: typeof a.street === "string" ? a.street : "",
    apt: typeof a.apt === "string" ? a.apt : "",
    city: typeof a.city === "string" ? a.city : "",
    state: typeof a.state === "string" ? a.state : "",
    zip: typeof a.zip === "string" ? a.zip : "",
    phone: typeof a.phone === "string" ? a.phone : "",
  };

  const del = o.delivery;
  if (!del || typeof del !== "object") return null;
  const d = del as Record<string, unknown>;
  const window = d.window;
  if (typeof window !== "string" || !WINDOW_SET.has(window as DeliveryWindowCode)) return null;
  const delivery: StructuredCheckoutDelivery = {
    window: window as DeliveryWindowCode,
    notes: typeof d.notes === "string" ? d.notes : "",
    isGift: d.isGift === true,
    giftMessage: typeof d.giftMessage === "string" ? d.giftMessage : "",
  };

  const pm = o.paymentMeta;
  if (!pm || typeof pm !== "object") return null;
  const p = pm as Record<string, unknown>;
  if (p.sameAsDelivery !== true && p.sameAsDelivery !== false) return null;
  const billingZip = typeof p.billingZip === "string" ? p.billingZip : undefined;

  return {
    neighborhoodSlug,
    checkoutMode,
    address,
    delivery,
    paymentMeta: {
      sameAsDelivery: p.sameAsDelivery,
      billingZip: p.sameAsDelivery ? undefined : billingZip,
    },
  };
}
