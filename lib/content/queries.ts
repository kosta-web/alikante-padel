"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient, publicImageUrl } from "@/lib/supabase/public";
import { requireAdminSession } from "@/lib/admin-auth";
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
------------------------------------------------------------------ */

function mapCard(row: any): Card {
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

function mapArticleCategory(row: any): ArticleCategory {
  return { id: row.id, label: row.label };
}

function mapArticle(row: any): Article {
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

function mapGame(row: any): Game {
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

function mapPricePackage(row: any): PricePackage {
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

function mapGalleryCategory(row: any): GalleryCategory {
  return { id: row.id, label: row.label, sortOrder: row.sort_order };
}

function mapGalleryPhoto(row: any): GalleryPhoto {
  return {
    id: row.id,
    categoryId: row.category_id,
    image: publicImageUrl(row.image_path) ?? "",
    alt: row.alt ?? undefined,
    caption: row.caption ?? undefined,
    sortOrder: row.sort_order,
  };
}

function mapSiteSettings(row: any): SiteSettings {
  return {
    siteTitle: row.site_title,
    siteDescription: row.site_description,
    favicon: publicImageUrl(row.favicon_path),
  };
}

function mapSeoPage(row: any): SeoPage {
  return {
    pageSlug: row.page_slug,
    title: row.title ?? "",
    description: row.description ?? "",
  };
}

/* ------------------------------------------------------------------
   Public reads — anon/publishable key, RLS-limited (published articles
   only). Safe to call from any Server Component.

   Читаются они из Server Components без Suspense-границы, поэтому
   бросить здесь — значит уронить всю страницу. Supabase периодически
   отвечает таймаутом, и из-за одной подвисшей секции посетитель получал
   500 вместо сайта. `publicRead` глотает сбой, пишет его в лог функции
   (виден в Vercel) и отдаёт пустое значение — секция просто не
   отрисуется, остальная страница живёт.
------------------------------------------------------------------ */

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "TOP PADEL ALICANTE",
  siteDescription: "",
};

async function publicRead<T>(
  what: string,
  run: () => PromiseLike<{ data: any; error: { message: string } | null }>,
  onData: (data: any) => T,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await run();
    if (error) {
      console.error(`[content] чтение «${what}» не удалось: ${error.message}`);
      return fallback;
    }
    return onData(data);
  } catch (cause) {
    // Сеть отвалилась или не заданы переменные окружения Supabase.
    console.error(`[content] чтение «${what}» не удалось:`, cause);
    return fallback;
  }
}

export async function getCards(): Promise<Card[]> {
  return publicRead(
    "карточки",
    () => createPublicClient().from("cards").select("*").order("sort_order", { ascending: true }),
    (data) => (data ?? []).map(mapCard),
    []
  );
}

export async function getArticleCategories(): Promise<ArticleCategory[]> {
  return publicRead(
    "категории статей",
    () =>
      createPublicClient()
        .from("article_categories")
        .select("*")
        .order("created_at", { ascending: true }),
    (data) => (data ?? []).map(mapArticleCategory),
    []
  );
}

export async function getPublishedArticles(): Promise<Article[]> {
  return publicRead(
    "опубликованные статьи",
    () =>
      createPublicClient()
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false }),
    (data) => (data ?? []).map(mapArticle),
    []
  );
}

/**
 * Единственное публичное чтение без деградации: страница статьи — это и есть
 * одна запись. Отдать здесь null при сбое Supabase значит показать «Статья не
 * найдена» для существующей статьи, то есть соврать читателю и поисковику;
 * пусть лучше упадёт и URL останется валидным для повторной попытки.
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await createPublicClient()
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapArticle(data) : null;
}

export async function getGames(opts?: {
  limit?: number;
  excludeStatuses?: Array<Game["status"]>;
}): Promise<Game[]> {
  return publicRead(
    "игры",
    () => {
      let query = createPublicClient()
        .from("games")
        .select("*")
        .order("starts_at", { ascending: true });
      if (opts?.excludeStatuses?.length) {
        query = query.not("status", "in", `(${opts.excludeStatuses.join(",")})`);
      }
      if (opts?.limit) query = query.limit(opts.limit);
      return query;
    },
    (data) => (data ?? []).map(mapGame),
    []
  );
}

export async function getPricePackages(): Promise<PricePackage[]> {
  return publicRead(
    "тарифы",
    () =>
      createPublicClient()
        .from("price_packages")
        .select("*")
        .order("sort_order", { ascending: true }),
    (data) => (data ?? []).map(mapPricePackage),
    []
  );
}

export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  return publicRead(
    "категории галереи",
    () =>
      createPublicClient()
        .from("gallery_categories")
        .select("*")
        .order("sort_order", { ascending: true }),
    (data) => (data ?? []).map(mapGalleryCategory),
    []
  );
}

export async function getGalleryPhotos(opts?: { limit?: number }): Promise<GalleryPhoto[]> {
  return publicRead(
    "фото галереи",
    () => {
      let query = createPublicClient()
        .from("gallery_photos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (opts?.limit) query = query.limit(opts.limit);
      return query;
    },
    (data) => (data ?? []).map(mapGalleryPhoto),
    []
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return publicRead(
    "настройки сайта",
    () => createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle(),
    (data) => (data ? mapSiteSettings(data) : DEFAULT_SETTINGS),
    DEFAULT_SETTINGS
  );
}

export async function getSeoPage(pageSlug: string): Promise<SeoPage | null> {
  return publicRead(
    `SEO для ${pageSlug}`,
    () =>
      createPublicClient().from("seo_pages").select("*").eq("page_slug", pageSlug).maybeSingle(),
    (data) => (data ? mapSeoPage(data) : null),
    null
  );
}

/* ------------------------------------------------------------------
   Admin reads — service-role key, bypasses RLS (sees drafts etc).
   Requires a valid admin cookie session.

   Здесь деградации нет намеренно: пустой список в редакторе читается как
   «контент пропал», и его начнут заводить заново поверх существующего.
   Редактору нужна честная ошибка.
------------------------------------------------------------------ */

export type AdminContent = {
  cards: Card[];
  articleCategories: ArticleCategory[];
  articles: Article[];
  games: Game[];
  pricePackages: PricePackage[];
  galleryCategories: GalleryCategory[];
  galleryPhotos: GalleryPhoto[];
  settings: SiteSettings;
  seoPages: SeoPage[];
};

export async function getAdminContent(): Promise<AdminContent> {
  await requireAdminSession();
  const db = createAdminClient();

  const [
    cards,
    articleCategories,
    articles,
    games,
    pricePackages,
    galleryCategories,
    galleryPhotos,
    settings,
    seoPages,
  ] = await Promise.all([
    db.from("cards").select("*").order("sort_order", { ascending: true }),
    db.from("article_categories").select("*").order("created_at", { ascending: true }),
    db.from("articles").select("*").order("published_at", { ascending: false }),
    db.from("games").select("*").order("starts_at", { ascending: true }),
    db.from("price_packages").select("*").order("sort_order", { ascending: true }),
    db.from("gallery_categories").select("*").order("sort_order", { ascending: true }),
    db.from("gallery_photos").select("*").order("sort_order", { ascending: true }),
    db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("seo_pages").select("*").order("page_slug", { ascending: true }),
  ]);

  for (const result of [
    cards,
    articleCategories,
    articles,
    games,
    pricePackages,
    galleryCategories,
    galleryPhotos,
    settings,
    seoPages,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    cards: (cards.data ?? []).map(mapCard),
    articleCategories: (articleCategories.data ?? []).map(mapArticleCategory),
    articles: (articles.data ?? []).map(mapArticle),
    games: (games.data ?? []).map(mapGame),
    pricePackages: (pricePackages.data ?? []).map(mapPricePackage),
    galleryCategories: (galleryCategories.data ?? []).map(mapGalleryCategory),
    galleryPhotos: (galleryPhotos.data ?? []).map(mapGalleryPhoto),
    settings: settings.data
      ? mapSiteSettings(settings.data)
      : { siteTitle: "TOP PADEL ALICANTE", siteDescription: "" },
    seoPages: (seoPages.data ?? []).map(mapSeoPage),
  };
}
