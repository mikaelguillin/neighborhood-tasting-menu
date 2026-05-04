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
  vendors: NeighborhoodVendor[];
  /** Vendor product display names assigned to this neighborhood (inventory lineup). */
  items: string[];
  highlight?: boolean;
  badge?: string;
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
