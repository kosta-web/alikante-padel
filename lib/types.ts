/* ------------------------------------------------------------------
   Admin-editable content — lives in Supabase, not here. These are the
   app-side (camelCase) shapes; `lib/content/queries.ts` maps DB rows
   (snake_case) to these.
------------------------------------------------------------------ */

export type Card = {
  id: string;
  label: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
  /** object-position for the photo — tuned per shot so the subject survives the crop */
  focus?: string;
  featured: boolean;
  sortOrder: number;
};

export type ArticleCategory = {
  id: string;
  label: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  categoryId: string | null;
  image?: string;
  /** Paragraphs separated by a blank line. */
  body: string;
  seoTitle: string;
  seoDescription: string;
  /** ISO date (yyyy-mm-dd) */
  publishedAt: string;
  published: boolean;
};

export type SiteSettings = {
  siteTitle: string;
  siteDescription: string;
  favicon?: string;
};

export type SeoPage = {
  pageSlug: string;
  title: string;
  description: string;
};

export type GameStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type Game = {
  id: string;
  title: string;
  format?: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  description?: string;
  image?: string;
  status: GameStatus;
  spotsTotal?: number;
  spotsTaken?: number;
  signupHref: string;
  sortOrder: number;
};

export type PricePackage = {
  id: string;
  title: string;
  price: number;
  currency: string;
  unit?: string;
  description?: string;
  features: string[];
  featured: boolean;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
};

export type GalleryCategory = {
  id: string;
  label: string;
  sortOrder: number;
};

export type GalleryPhoto = {
  id: string;
  categoryId: string | null;
  image: string;
  alt?: string;
  caption?: string;
  sortOrder: number;
};
