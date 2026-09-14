"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import type {
  Article,
  ArticleCategory,
  Card,
  Game,
  GalleryCategory,
  GalleryPhoto,
  PricePackage,
  SiteSettings,
} from "@/lib/types";

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

export async function createCard(input: Omit<Card, "id" | "sortOrder">) {
  await requireAdminSession();
  const db = createAdminClient();
  const { count } = await db.from("cards").select("id", { count: "exact", head: true });
  const { error } = await db.from("cards").insert({
    label: input.label,
    title: input.title,
    subtitle: input.subtitle || null,
    href: input.href || "#",
    image_path: input.image || null,
    focus: input.focus || null,
    featured: input.featured,
    sort_order: count ?? 0,
  });
  if (error) throw error;
  revalidatePublic();
}

export async function updateCard(id: string, patch: Partial<Omit<Card, "id">>) {
  await requireAdminSession();
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
  await requireAdminSession();
  const { error } = await createAdminClient().from("cards").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function moveCard(id: string, direction: -1 | 1) {
  await requireAdminSession();
  await reorderAdjacent("cards", id, direction);
  revalidatePublic();
}

/* ------------------------------------------------------- article categories */

export async function createArticleCategory(label: string): Promise<ArticleCategory> {
  await requireAdminSession();
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
  await requireAdminSession();
  const { error } = await createAdminClient()
    .from("article_categories")
    .update({ label })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteArticleCategory(id: string) {
  await requireAdminSession();
  const { error } = await createAdminClient().from("article_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

/* ------------------------------------------------------------------- articles */

export async function createArticle(input: Omit<Article, "id">): Promise<Article> {
  await requireAdminSession();
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
  await requireAdminSession();
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
  await requireAdminSession();
  const { error } = await createAdminClient().from("articles").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

/* -------------------------------------------------------------------- games */

export async function createGame(input: Omit<Game, "id" | "sortOrder">) {
  await requireAdminSession();
  const db = createAdminClient();
  const { count } = await db.from("games").select("id", { count: "exact", head: true });
  const { error } = await db.from("games").insert({
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
  });
  if (error) throw error;
  revalidatePublic();
}

export async function updateGame(id: string, patch: Partial<Omit<Game, "id">>) {
  await requireAdminSession();
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
  await requireAdminSession();
  const { error } = await createAdminClient().from("games").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function moveGame(id: string, direction: -1 | 1) {
  await requireAdminSession();
  await reorderAdjacent("games", id, direction);
  revalidatePublic();
}

/* ------------------------------------------------------------ price packages */

export async function createPricePackage(input: Omit<PricePackage, "id" | "sortOrder">) {
  await requireAdminSession();
  const db = createAdminClient();
  const { count } = await db.from("price_packages").select("id", { count: "exact", head: true });
  const { error } = await db.from("price_packages").insert({
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
  });
  if (error) throw error;
  revalidatePublic();
}

export async function updatePricePackage(id: string, patch: Partial<Omit<PricePackage, "id">>) {
  await requireAdminSession();
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
  await requireAdminSession();
  const { error } = await createAdminClient().from("price_packages").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function movePricePackage(id: string, direction: -1 | 1) {
  await requireAdminSession();
  await reorderAdjacent("price_packages", id, direction);
  revalidatePublic();
}

/* ------------------------------------------------------------ gallery categories */

export async function createGalleryCategory(label: string): Promise<GalleryCategory> {
  await requireAdminSession();
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
  await requireAdminSession();
  const { error } = await createAdminClient()
    .from("gallery_categories")
    .update({ label })
    .eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function deleteGalleryCategory(id: string) {
  await requireAdminSession();
  const { error } = await createAdminClient().from("gallery_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

/* ---------------------------------------------------------------- gallery photos */

export async function createGalleryPhoto(input: Omit<GalleryPhoto, "id" | "sortOrder">) {
  await requireAdminSession();
  const db = createAdminClient();
  const { count } = await db.from("gallery_photos").select("id", { count: "exact", head: true });
  const { error } = await db.from("gallery_photos").insert({
    category_id: input.categoryId || null,
    image_path: input.image,
    alt: input.alt || null,
    caption: input.caption || null,
    sort_order: count ?? 0,
  });
  if (error) throw error;
  revalidatePublic();
}

export async function updateGalleryPhoto(id: string, patch: Partial<Omit<GalleryPhoto, "id">>) {
  await requireAdminSession();
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
  await requireAdminSession();
  const { error } = await createAdminClient().from("gallery_photos").delete().eq("id", id);
  if (error) throw error;
  revalidatePublic();
}

export async function moveGalleryPhoto(id: string, direction: -1 | 1) {
  await requireAdminSession();
  await reorderAdjacent("gallery_photos", id, direction);
  revalidatePublic();
}

/* ----------------------------------------------------------------- settings */

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  await requireAdminSession();
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
  await requireAdminSession();
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
