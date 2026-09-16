"use server";

import * as core from "@/lib/content/core";
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

/* ------------------------------------------------------------------
   Server Actions веб-админки. Здесь только проверка cookie-сессии —
   сама запись живёт в `lib/content/core.ts`, общем с Telegram-ботом
   (у него свой способ проверки: сверка отправителя с TELEGRAM_ADMIN_IDS).

   Дашборд и так не отрисуется без сессии, но каждое такое действие —
   самостоятельная HTTP-точка, поэтому проверка повторяется здесь:
   эшелонированная защита перед любой service-role записью.
------------------------------------------------------------------ */

/* ------------------------------------------------------------------ cards */

export async function createCard(input: Omit<Card, "id" | "sortOrder">): Promise<string> {
  await requireAdminSession();
  return core.createCard(input);
}

export async function updateCard(id: string, patch: Partial<Omit<Card, "id">>) {
  await requireAdminSession();
  return core.updateCard(id, patch);
}

export async function deleteCard(id: string) {
  await requireAdminSession();
  return core.deleteCard(id);
}

export async function moveCard(id: string, direction: -1 | 1) {
  await requireAdminSession();
  return core.moveCard(id, direction);
}

/* ------------------------------------------------------- article categories */

export async function createArticleCategory(label: string): Promise<ArticleCategory> {
  await requireAdminSession();
  return core.createArticleCategory(label);
}

export async function renameArticleCategory(id: string, label: string) {
  await requireAdminSession();
  return core.renameArticleCategory(id, label);
}

export async function deleteArticleCategory(id: string) {
  await requireAdminSession();
  return core.deleteArticleCategory(id);
}

/* ------------------------------------------------------------------- articles */

export async function createArticle(input: Omit<Article, "id">): Promise<Article> {
  await requireAdminSession();
  return core.createArticle(input);
}

export async function updateArticle(id: string, patch: Partial<Omit<Article, "id">>) {
  await requireAdminSession();
  return core.updateArticle(id, patch);
}

export async function deleteArticle(id: string) {
  await requireAdminSession();
  return core.deleteArticle(id);
}

/* -------------------------------------------------------------------- games */

export async function createGame(input: Omit<Game, "id" | "sortOrder">): Promise<string> {
  await requireAdminSession();
  return core.createGame(input);
}

export async function updateGame(id: string, patch: Partial<Omit<Game, "id">>) {
  await requireAdminSession();
  return core.updateGame(id, patch);
}

export async function deleteGame(id: string) {
  await requireAdminSession();
  return core.deleteGame(id);
}

export async function moveGame(id: string, direction: -1 | 1) {
  await requireAdminSession();
  return core.moveGame(id, direction);
}

/* ------------------------------------------------------------ price packages */

export async function createPricePackage(input: Omit<PricePackage, "id" | "sortOrder">): Promise<string> {
  await requireAdminSession();
  return core.createPricePackage(input);
}

export async function updatePricePackage(id: string, patch: Partial<Omit<PricePackage, "id">>) {
  await requireAdminSession();
  return core.updatePricePackage(id, patch);
}

export async function deletePricePackage(id: string) {
  await requireAdminSession();
  return core.deletePricePackage(id);
}

export async function movePricePackage(id: string, direction: -1 | 1) {
  await requireAdminSession();
  return core.movePricePackage(id, direction);
}

/* ------------------------------------------------------------ gallery categories */

export async function createGalleryCategory(label: string): Promise<GalleryCategory> {
  await requireAdminSession();
  return core.createGalleryCategory(label);
}

export async function renameGalleryCategory(id: string, label: string) {
  await requireAdminSession();
  return core.renameGalleryCategory(id, label);
}

export async function deleteGalleryCategory(id: string) {
  await requireAdminSession();
  return core.deleteGalleryCategory(id);
}

/* ---------------------------------------------------------------- gallery photos */

export async function createGalleryPhoto(input: Omit<GalleryPhoto, "id" | "sortOrder">): Promise<string> {
  await requireAdminSession();
  return core.createGalleryPhoto(input);
}

export async function updateGalleryPhoto(id: string, patch: Partial<Omit<GalleryPhoto, "id">>) {
  await requireAdminSession();
  return core.updateGalleryPhoto(id, patch);
}

export async function deleteGalleryPhoto(id: string) {
  await requireAdminSession();
  return core.deleteGalleryPhoto(id);
}

export async function moveGalleryPhoto(id: string, direction: -1 | 1) {
  await requireAdminSession();
  return core.moveGalleryPhoto(id, direction);
}

/* ----------------------------------------------------------------- settings */

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  await requireAdminSession();
  return core.updateSiteSettings(patch);
}

/* ----------------------------------------------------------------- seo pages */

export async function upsertSeoPage(pageSlug: string, patch: { title: string; description: string }) {
  await requireAdminSession();
  return core.upsertSeoPage(pageSlug, patch);
}
