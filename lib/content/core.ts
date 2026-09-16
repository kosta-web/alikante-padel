import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { publicImageUrl } from "@/lib/supabase/public";
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
   Ядро админских операций: чтение всего контента (включая черновики),
   запись и загрузка файлов — service-role ключом, в обход RLS.

   Проверки доступа здесь НЕТ намеренно. Её делает каждый вызывающий,
   своим способом: веб-админка — cookie-сессией (`lib/content/actions.ts`),
   Telegram-бот — сверкой отправителя с TELEGRAM_ADMIN_IDS. Логика правок
   при этом одна на оба входа. `server-only` не даёт утащить модуль в
   клиентский бандл.
------------------------------------------------------------------ */

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath("/prices");
  revalidatePath("/gallery");
  revalidatePath("/articles/[slug]", "page");
}

async function reorderAdjacent(table: string, id: string, direction: -1 | 1) {
  const db = createAdminClient();
  const { data, error } = await db.from(table).select("id, sort_order").order("sort_order", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as { id: string; sort_order: number }[];
  const idx = rows.findIndex((r) => r.id === id);
  const targetIdx = idx + direction;
  if (idx < 0 || targetIdx < 0 || targetIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[targetIdx];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    db.from(table).update({ sort_order: b.sort_order }).eq("id", a.id),
    db.from(table).update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
}

/* ------------------------------------------------------------------ cards */

export async function createCard(input: Omit<Card, "id" | "sortOrder">): Promise<string> {
  const db = createAdminClient();
  const { count } = await db.from("cards").select("id", { count: "exact", head: true });
  const { data, error } = await db.from("cards").insert({
    label: input.label,
    title: input.title,
    subtitle: input.subtitle || null,
    href: input.href || "#",
    image_path: input.image || null,
    focus: input.focus || null,
    featured: input.featured,
    sort_order: count ?? 0,
  })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePublic();
  return data.id;
}

export async function updateCard(id: string, patch: Partial<Omit<Card, "id">>) {
  const { error } = await createAdminClient()
    .from("cards")
    .update({
      ...(patch.label !== undefined && { label: patch.label }),
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.subtitle !== undefined && { subtitle: patch.subtitle || null }),
      ...(patch.href !== undefined && { href: patch.href || "#" }),
      ...(patch.image !== undefined && { image_path: patch.image || null }),
      ...(patch.focus !== undefined && { focus: patch.focus || null }),
      ...(patch.featured !== undefined && { featured: patch.featured }),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteCard(id: string) {
  const { error } = await createAdminClient().from("cards").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function moveCard(id: string, direction: -1 | 1) {
  await reorderAdjacent("cards", id, direction);
  revalidatePublic();
}

/* ------------------------------------------------------- article categories */

export async function createArticleCategory(label: string): Promise<ArticleCategory> {
  const { data, error } = await createAdminClient()
    .from("article_categories")
    .insert({ label })
    .select()
    .single();
  if (error) throw error;
  revalidatePublic();
  return { id: data.id, label: data.label };
}

export async function renameArticleCategory(id: string, label: string) {
  const { error } = await createAdminClient()
    .from("article_categories")
    .update({ label })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteArticleCategory(id: string) {
  const { error } = await createAdminClient().from("article_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

/* ------------------------------------------------------------------- articles */

export async function createArticle(input: Omit<Article, "id">): Promise<Article> {
  const { data, error } = await createAdminClient()
    .from("articles")
    .insert({
      slug: input.slug,
      title: input.title,
      category_id: input.categoryId || null,
      image_path: input.image || null,
      body: input.body,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
      published_at: input.publishedAt,
      published: input.published,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePublic();
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    categoryId: data.category_id,
    image: data.image_path ?? undefined,
    body: data.body,
    seoTitle: data.seo_title ?? "",
    seoDescription: data.seo_description ?? "",
    publishedAt: data.published_at,
    published: data.published,
  };
}

export async function updateArticle(id: string, patch: Partial<Omit<Article, "id">>) {
  const { error } = await createAdminClient()
    .from("articles")
    .update({
      ...(patch.slug !== undefined && { slug: patch.slug }),
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.categoryId !== undefined && { category_id: patch.categoryId || null }),
      ...(patch.image !== undefined && { image_path: patch.image || null }),
      ...(patch.body !== undefined && { body: patch.body }),
      ...(patch.seoTitle !== undefined && { seo_title: patch.seoTitle || null }),
      ...(patch.seoDescription !== undefined && { seo_description: patch.seoDescription || null }),
      ...(patch.publishedAt !== undefined && { published_at: patch.publishedAt }),
      ...(patch.published !== undefined && { published: patch.published }),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteArticle(id: string) {
  const { error } = await createAdminClient().from("articles").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

/* -------------------------------------------------------------------- games */

export async function createGame(input: Omit<Game, "id" | "sortOrder">): Promise<string> {
  const db = createAdminClient();
  const { count } = await db.from("games").select("id", { count: "exact", head: true });
  const { data, error } = await db.from("games").insert({
    title: input.title,
    format: input.format || null,
    starts_at: input.startsAt,
    ends_at: input.endsAt || null,
    location: input.location || null,
    description: input.description || null,
    image_path: input.image || null,
    status: input.status,
    spots_total: input.spotsTotal ?? null,
    spots_taken: input.spotsTaken ?? null,
    signup_href: input.signupHref || "#",
    sort_order: count ?? 0,
  })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePublic();
  return data.id;
}

export async function updateGame(id: string, patch: Partial<Omit<Game, "id">>) {
  const { error } = await createAdminClient()
    .from("games")
    .update({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.format !== undefined && { format: patch.format || null }),
      ...(patch.startsAt !== undefined && { starts_at: patch.startsAt }),
      ...(patch.endsAt !== undefined && { ends_at: patch.endsAt || null }),
      ...(patch.location !== undefined && { location: patch.location || null }),
      ...(patch.description !== undefined && { description: patch.description || null }),
      ...(patch.image !== undefined && { image_path: patch.image || null }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.spotsTotal !== undefined && { spots_total: patch.spotsTotal ?? null }),
      ...(patch.spotsTaken !== undefined && { spots_taken: patch.spotsTaken ?? null }),
      ...(patch.signupHref !== undefined && { signup_href: patch.signupHref || "#" }),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteGame(id: string) {
  const { error } = await createAdminClient().from("games").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function moveGame(id: string, direction: -1 | 1) {
  await reorderAdjacent("games", id, direction);
  revalidatePublic();
}

/* ------------------------------------------------------------ price packages */

export async function createPricePackage(input: Omit<PricePackage, "id" | "sortOrder">): Promise<string> {
  const db = createAdminClient();
  const { count } = await db.from("price_packages").select("id", { count: "exact", head: true });
  const { data, error } = await db.from("price_packages").insert({
    title: input.title,
    price: input.price,
    currency: input.currency || "EUR",
    unit: input.unit || null,
    description: input.description || null,
    features: input.features,
    featured: input.featured,
    cta_label: input.ctaLabel || "Записаться",
    cta_href: input.ctaHref || "#",
    sort_order: count ?? 0,
  })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePublic();
  return data.id;
}

export async function updatePricePackage(id: string, patch: Partial<Omit<PricePackage, "id">>) {
  const { error } = await createAdminClient()
    .from("price_packages")
    .update({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.price !== undefined && { price: patch.price }),
      ...(patch.currency !== undefined && { currency: patch.currency || "EUR" }),
      ...(patch.unit !== undefined && { unit: patch.unit || null }),
      ...(patch.description !== undefined && { description: patch.description || null }),
      ...(patch.features !== undefined && { features: patch.features }),
      ...(patch.featured !== undefined && { featured: patch.featured }),
      ...(patch.ctaLabel !== undefined && { cta_label: patch.ctaLabel || "Записаться" }),
      ...(patch.ctaHref !== undefined && { cta_href: patch.ctaHref || "#" }),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deletePricePackage(id: string) {
  const { error } = await createAdminClient().from("price_packages").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function movePricePackage(id: string, direction: -1 | 1) {
  await reorderAdjacent("price_packages", id, direction);
  revalidatePublic();
}

/* ------------------------------------------------------------ gallery categories */

export async function createGalleryCategory(label: string): Promise<GalleryCategory> {
  const db = createAdminClient();
  const { count } = await db.from("gallery_categories").select("id", { count: "exact", head: true });
  const { data, error } = await db
    .from("gallery_categories")
    .insert({ label, sort_order: count ?? 0 })
    .select()
    .single();
  if (error) throw error;
  revalidatePublic();
  return { id: data.id, label: data.label, sortOrder: data.sort_order };
}

export async function renameGalleryCategory(id: string, label: string) {
  const { error } = await createAdminClient()
    .from("gallery_categories")
    .update({ label })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteGalleryCategory(id: string) {
  const { error } = await createAdminClient().from("gallery_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

/* ---------------------------------------------------------------- gallery photos */

export async function createGalleryPhoto(input: Omit<GalleryPhoto, "id" | "sortOrder">): Promise<string> {
  const db = createAdminClient();
  const { count } = await db.from("gallery_photos").select("id", { count: "exact", head: true });
  const { data, error } = await db.from("gallery_photos").insert({
    category_id: input.categoryId || null,
    image_path: input.image,
    alt: input.alt || null,
    caption: input.caption || null,
    sort_order: count ?? 0,
  })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePublic();
  return data.id;
}

export async function updateGalleryPhoto(id: string, patch: Partial<Omit<GalleryPhoto, "id">>) {
  const { error } = await createAdminClient()
    .from("gallery_photos")
    .update({
      ...(patch.categoryId !== undefined && { category_id: patch.categoryId || null }),
      ...(patch.image !== undefined && { image_path: patch.image }),
      ...(patch.alt !== undefined && { alt: patch.alt || null }),
      ...(patch.caption !== undefined && { caption: patch.caption || null }),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteGalleryPhoto(id: string) {
  const { error } = await createAdminClient().from("gallery_photos").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function moveGalleryPhoto(id: string, direction: -1 | 1) {
  await reorderAdjacent("gallery_photos", id, direction);
  revalidatePublic();
}

/* ----------------------------------------------------------------- settings */

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  const { error } = await createAdminClient()
    .from("site_settings")
    .update({
      ...(patch.siteTitle !== undefined && { site_title: patch.siteTitle }),
      ...(patch.siteDescription !== undefined && { site_description: patch.siteDescription }),
      ...(patch.favicon !== undefined && { favicon_path: patch.favicon || null }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw error;
  revalidatePublic();
}

/* ----------------------------------------------------------------- seo pages */

export async function upsertSeoPage(pageSlug: string, patch: { title: string; description: string }) {
  const { error } = await createAdminClient()
    .from("seo_pages")
    .upsert({
      page_slug: pageSlug,
      title: patch.title,
      description: patch.description,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
  revalidatePublic();
}

/* ------------------------------------------------------------------ чтение */

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

/**
 * Весь админский контент одним заходом, service-role ключом (видит и
 * неопубликованные статьи).
 *
 * Деградации при сбое нет намеренно: пустой список в редакторе читается как
 * «контент пропал», и его начнут заводить заново поверх существующего.
 * Редактору нужна честная ошибка.
 */
export async function readAdminContent(): Promise<AdminContent> {
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

/* ----------------------------------------------------------------- загрузка */

/**
 * Кладёт картинку в Storage и возвращает её публичный URL. Принимает готовые
 * байты, а не `File`: из веб-админки приходит File, из Telegram — скачанный
 * буфер, и оба пути должны попадать в один и тот же bucket.
 */
export async function uploadImageBytes(
  folder: string,
  bytes: ArrayBuffer | Uint8Array,
  opts?: { contentType?: string; ext?: string }
): Promise<string> {
  const ext = (opts?.ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await createAdminClient()
    .storage.from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: opts?.contentType || undefined });
  if (error) throw error;

  const url = publicImageUrl(path);
  if (!url) throw new Error("Could not resolve uploaded image URL");
  return url;
}
