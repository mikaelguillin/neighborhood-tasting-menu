import type { StaticImageData } from "next/image";

export type Neighborhood = {
  slug: string;
  name: string;
  borough: string;
  tagline: string;
  description: string;
  image: string | StaticImageData;
  vendors: { name: string; craft: string }[];
  items: string[];
  highlight?: boolean;
  badge?: string;
};

import astoria from "@/assets/box-astoria.jpg";
import westVillage from "@/assets/box-west-village.jpg";
import lic from "@/assets/box-lic.jpg";
import les from "@/assets/box-les.jpg";

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: "long-island-city",
    name: "The Best of Long Island City",
    borough: "Queens",
    tagline: "Sourdough, cold brew & Brooklyn-roasted comfort.",
    description:
      "A pilot box from the LIC waterfront — slow-fermented sourdough, hand-rolled bagels, small-batch nut butter, and a bottle of single-origin cold brew from a roaster two blocks from the East River.",
    image: lic,
    badge: "Pilot Neighborhood",
    highlight: true,
    items: [
      "Country sourdough loaf — Hunters Point Bakery",
      "Half-dozen hand-rolled bagels — 5 Borough Bagel Co.",
      "Small-batch peanut butter — Vernon Pantry",
      "12oz single-origin cold brew — Pier 26 Roasters",
      "Dark chocolate bar — Queens Cocoa",
    ],
    vendors: [
      { name: "Hunters Point Bakery", craft: "Sourdough & country breads" },
      { name: "5 Borough Bagel Co.", craft: "Hand-rolled bagels" },
      { name: "Vernon Pantry", craft: "Nut butters & preserves" },
      { name: "Pier 26 Roasters", craft: "Single-origin coffee" },
    ],
  },
  {
    slug: "west-village",
    name: "West Village Essentials",
    borough: "Manhattan",
    tagline: "Croissants, brie, charcuterie — a Sunday morning, boxed.",
    description:
      "An unhurried West Village brunch in a single delivery. Buttery viennoiserie, a wheel of bloomy-rind brie, paper-wrapped charcuterie, and fig jam from a Bleecker Street pantry shop.",
    image: westVillage,
    items: [
      "Two all-butter croissants — Rue Perry",
      "Mini wheel of brie — The Cheese Counter",
      "Sliced prosciutto & coppa — Carmine St. Salumi",
      "Black mission fig jam — Bleecker Pantry",
      "Box of cocoa-dusted truffles — Greenwich Chocolatier",
    ],
    vendors: [
      { name: "Rue Perry", craft: "French viennoiserie" },
      { name: "The Cheese Counter", craft: "Affineur & cheesemonger" },
      { name: "Carmine St. Salumi", craft: "Cured meats" },
      { name: "Bleecker Pantry", craft: "Preserves & pantry" },
    ],
  },
  {
    slug: "astoria",
    name: "The Best of Astoria",
    borough: "Queens",
    tagline: "Phyllo, honey & olives from 30th Avenue.",
    description:
      "A walk down 30th Avenue without leaving your apartment. Honey-soaked baklava, fresh-baked pita, marinated olives, and wildflower honey from Astoria's Greek and Levantine makers.",
    image: astoria,
    items: [
      "Pistachio baklava (8 pieces) — Athena Sweets",
      "Fresh pita & lavash — 30th Ave Bakery",
      "Marinated Kalamata olives — Ditmars Deli",
      "Wildflower honey jar — Hellenic Apiaries",
      "Spiced halva bar — Levantine & Co.",
    ],
    vendors: [
      { name: "Athena Sweets", craft: "Greek pastries" },
      { name: "30th Ave Bakery", craft: "Pita & flatbreads" },
      { name: "Ditmars Deli", craft: "Olives & antipasti" },
      { name: "Hellenic Apiaries", craft: "Wildflower honey" },
    ],
  },
  {
    slug: "lower-east-side",
    name: "Lower East Side Classics",
    borough: "Manhattan",
    tagline: "Black-and-white cookies, knishes & a Sunday babka.",
    description:
      "The deli classics that built the LES, gathered into one box. An everything bagel, a warm knish, half-sour pickles, a chocolate babka, and a black-and-white cookie the size of your hand.",
    image: les,
    items: [
      "Half-dozen everything bagels — Orchard St. Bakeshop",
      "Potato knishes (4) — Rivington Knish Co.",
      "Half-sour pickle jar — Essex St. Picklers",
      "Mini chocolate babka — Delancey Bakery",
      "Black-and-white cookies (2) — Houston St. Pastry",
    ],
    vendors: [
      { name: "Orchard St. Bakeshop", craft: "Bagels & bialys" },
      { name: "Rivington Knish Co.", craft: "Knishes & savory pastries" },
      { name: "Essex St. Picklers", craft: "Pickles & ferments" },
      { name: "Delancey Bakery", craft: "Babka & rugelach" },
    ],
  },
];

export function getNeighborhood(slug: string) {
  return NEIGHBORHOODS.find((n) => n.slug === slug);
}
