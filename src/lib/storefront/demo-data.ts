// Demo data for the customer-facing storefront (/shop).
//
// Sewsiness's current schema (Organization, Product) is scoped to a single
// tailoring business's own back office — there's no public, cross-business
// marketplace table yet (a customer browsing many tailors' catalogs, with
// public ratings, needs its own schema + RLS policy, since the existing
// model isolates each organization's data from every other one).
//
// This file stands in for that future API so the storefront screens are
// fully wired end-to-end today. Swap fetchFeaturedDesign / fetchTailors /
// fetchProduct for real Supabase queries once that marketplace schema
// exists — the shapes below are what those queries should return.

export interface StorefrontTailor {
  id: string;
  name: string;
  rating: number;
  initials: string;
  avatarHex: string;
}

export interface StorefrontCategory {
  id: string;
  label: string;
  icon: "cloths" | "bags" | "shoes" | "uniform" | "suit";
}

export interface StorefrontColorOption {
  id: string;
  label: string;
  hex: string;
}

export interface StorefrontAttribute {
  id: string;
  label: string;
  options: string[];
}

export interface StorefrontProduct {
  id: string;
  name: string;
  tailorName: string;
  price: number;
  garment: "shirt";
  colors: StorefrontColorOption[];
  attributes: StorefrontAttribute[];
}

export const CATEGORIES: StorefrontCategory[] = [
  { id: "cloths", label: "Cloths", icon: "cloths" },
  { id: "bags", label: "Bags", icon: "bags" },
  { id: "shoes", label: "Shoes", icon: "shoes" },
  { id: "uniform", label: "Uniform", icon: "uniform" },
  { id: "suit", label: "Suit", icon: "suit" },
];

export const FEATURED_DESIGN = {
  id: "featured-suit-01",
  title: "Tailored Premium Suits For Business & Formal",
  tailorName: "Kwame Owusu",
  rating: 4.8,
  orderCount: 151,
};

export const TOP_TAILORS: StorefrontTailor[] = [
  { id: "thomas", name: "Thomas", rating: 4.8, initials: "TH", avatarHex: "#16243d" },
  { id: "edward", name: "Edward", rating: 4.9, initials: "ED", avatarHex: "#1c8c7d" },
  { id: "abena", name: "Abena", rating: 4.7, initials: "AB", avatarHex: "#8a2f3a" },
];

export const PRODUCTS: Record<string, StorefrontProduct> = {
  "custom-shirt-01": {
    id: "custom-shirt-01",
    name: "Custom Shirt",
    tailorName: "Thomas",
    price: 15.75,
    garment: "shirt",
    colors: [
      { id: "navy", label: "Navy", hex: "#16243d" },
      { id: "teal", label: "Teal", hex: "#1c8c7d" },
      { id: "burgundy", label: "Burgundy", hex: "#8a2f3a" },
    ],
    attributes: [
      { id: "sleeves", label: "Sleeves", options: ["Long", "Short", "3/4"] },
      { id: "pocket", label: "Pocket", options: ["None", "One", "Two"] },
      { id: "placket", label: "Placket", options: ["Standard", "Hidden"] },
      { id: "half_placket", label: "Half placket", options: ["No", "Yes"] },
    ],
  },
};

export async function fetchFeaturedDesign() {
  return FEATURED_DESIGN;
}

export async function fetchTailors() {
  return TOP_TAILORS;
}

export async function fetchProduct(id: string) {
  return PRODUCTS[id] ?? null;
}
