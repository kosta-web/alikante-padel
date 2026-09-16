import { publicImageUrl } from "@/lib/supabase/public";
import type {
  Article,
  ArticleCategory,
  Card,
  Game,
  GalleryCategory,
  GalleryPhoto,
  PricePackage,
  SeoPage,
  SiteSettings,
} from "@/lib/types";

/* ------------------------------------------------------------------
   Row → app-shape mappers (DB is snake_case, app is camelCase).
   Общие для публичных чтений (`queries.ts`) и админских (`core.ts`),
   поэтому вынесены отдельным модулем: тут только чистые функции, без
   обращений к базе и без "use server".
------------------------------------------------------------------ */

export function mapCard(row: any): Card {
  return {
    id: row.id,
    label: row.label,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    href: row.href,
    image: publicImageUrl(row.image_path),
    focus: row.focus ?? undefined,
    featured: row.featured,
    sortOrder: row.sort_order,
  };
}

export function mapArticleCategory(row: any): ArticleCategory {
  return { id: row.id, label: row.label };
}

export function mapArticle(row: any): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    categoryId: row.category_id,
    image: publicImageUrl(row.image_path),
    body: row.body,
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    publishedAt: row.published_at,
    published: row.published,
  };
}

export function mapGame(row: any): Game {
  return {
    id: row.id,
    title: row.title,
    format: row.format ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    location: row.location ?? undefined,
    description: row.description ?? undefined,
    image: publicImageUrl(row.image_path),
    status: row.status,
    spotsTotal: row.spots_total ?? undefined,
    spotsTaken: row.spots_taken ?? undefined,
    signupHref: row.signup_href,
    sortOrder: row.sort_order,
  };
}

export function mapPricePackage(row: any): PricePackage {
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    currency: row.currency,
    unit: row.unit ?? undefined,
    description: row.description ?? undefined,
    features: row.features ?? [],
    featured: row.featured,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    sortOrder: row.sort_order,
  };
}

export function mapGalleryCategory(row: any): GalleryCategory {
  return { id: row.id, label: row.label, sortOrder: row.sort_order };
}

export function mapGalleryPhoto(row: any): GalleryPhoto {
  return {
    id: row.id,
    categoryId: row.category_id,
    image: publicImageUrl(row.image_path) ?? "",
    alt: row.alt ?? undefined,
    caption: row.caption ?? undefined,
    sortOrder: row.sort_order,
  };
}

export function mapSiteSettings(row: any): SiteSettings {
  return {
    siteTitle: row.site_title,
    siteDescription: row.site_description,
    favicon: publicImageUrl(row.favicon_path),
  };
}

export function mapSeoPage(row: any): SeoPage {
  return {
    pageSlug: row.page_slug,
    title: row.title ?? "",
    description: row.description ?? "",
  };
}
