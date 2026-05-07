export type UserRole = "customer" | "vendor" | "admin";

export interface HealthCheck {
  ok: boolean;
}

export const NYC_BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;

export type NycBorough = (typeof NYC_BOROUGHS)[number];

export type NeighborhoodVendor = {
  name: string;
  craft: string;
};

export type Neighborhood = {
  slug: string;
  name: string;
  borough: string;
  tagline: string;
  description: string;
  image: string;
  priceCents: number | null;
  vendors: NeighborhoodVendor[];
  items: string[];
  highlight?: boolean;
  badge?: string;
};

export type NeighborhoodPickerRow = {
  slug: string;
  name: string;
  borough: string;
  tagline: string;
  priceCents: number | null;
};

export type PlanId = "sampler" | "weekly" | "local-hero";

export type PlanOption = {
  id: PlanId;
  name: string;
  cadence: string;
  priceCents: number;
  blurb: string;
  perks: string[];
  featured?: boolean;
};
