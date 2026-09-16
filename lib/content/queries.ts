"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { requireAdminSession } from "@/lib/admin-auth";
import { readAdminContent, type AdminContent } from "@/lib/content/core";
import {
  mapArticle,
  mapArticleCategory,
  mapCard,
  mapGalleryCategory,
  mapGalleryPhoto,
  mapGame,
  mapPricePackage,
  mapSeoPage,
  mapSiteSettings,
} from "@/lib/content/mappers";
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
   Admin read — service-role key, bypasses RLS (sees drafts etc).
   Сама выборка живёт в `core.ts`, общем с Telegram-ботом; здесь только
   проверка cookie-сессии.
------------------------------------------------------------------ */

export type { AdminContent };

export async function getAdminContent(): Promise<AdminContent> {
  await requireAdminSession();
  return readAdminContent();
}
