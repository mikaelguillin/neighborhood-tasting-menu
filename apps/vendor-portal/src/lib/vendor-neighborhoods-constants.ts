export const NYC_BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;

export type NeighborhoodPickerRow = {
  slug: string;
  name: string;
  borough: string;
  tagline: string;
};
