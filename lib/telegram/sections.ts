import "server-only";
import * as core from "@/lib/content/core";
import type { AdminContent } from "@/lib/content/core";
import type { GameStatus } from "@/lib/types";
import { clip, showDate, showDateTime, slugify } from "./format";

/* ------------------------------------------------------------------
   Описание разделов бота: какие записи показывать списком, какие у них
   поля и через какую функцию из `lib/content/core.ts` их сохранять.

   Экраны бота собираются из этой таблицы, а не пишутся по одному на
   раздел, — иначе шесть почти одинаковых меню разъехались бы на первой
   же правке. Сама запись идёт теми же функциями, что и из веб-админки.
------------------------------------------------------------------ */

export type FieldType =
  | "text"
  | "longtext"
  | "number"
  | "bool"
  | "date"
  | "datetime"
  | "lines"
  | "choice";

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  /** Только для choice: варианты, значение "" означает «не задано». */
  choices?: { value: string; label: string }[];
  /** Подсказка под приглашением ввести значение. */
  hint?: string;
};

export type SectionItem = { id: string; title: string };

export type SectionSpec = {
  id: string;
  label: string;
  /** Раздел из единственной записи (настройки сайта) — списка нет. */
  single?: boolean;
  /** Что показать вместо списка, когда записей нет. */
  emptyHint?: string;
  /** Подразделы, доступные с экрана списка (например, категории). */
  related?: { id: string; label: string }[];
  list: (content: AdminContent) => SectionItem[];
  fields: (content: AdminContent) => FieldSpec[];
  read: (content: AdminContent, id: string) => Record<string, unknown> | undefined;
  apply: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  move?: (id: string, direction: -1 | 1) => Promise<unknown>;
  /** Создание новой записи одним полем; остальное дозаполняется правкой.
   *  `run` возвращает id новой записи — бот сразу открывает её карточку. */
  create?: { prompt: string; run: (value: string) => Promise<string> };
};

export const GAME_STATUSES: { value: GameStatus; label: string }[] = [
  { value: "upcoming", label: "Запланирована" },
  { value: "ongoing", label: "Идёт сейчас" },
  { value: "completed", label: "Завершена" },
  { value: "cancelled", label: "Отменена" },
];

const NO_CATEGORY = { value: "", label: "Без категории" };

function categoryChoices(items: { id: string; label: string }[]) {
  return [NO_CATEGORY, ...items.map((c) => ({ value: c.id, label: c.label }))];
}

function categoryName(items: { id: string; label: string }[], id: string | null | undefined) {
  return items.find((c) => c.id === id)?.label ?? "без категории";
}

export const SECTIONS: SectionSpec[] = [
  {
    id: "news",
    label: "📰 Новости",
    emptyHint: "Статей пока нет.",
    related: [{ id: "newsCats", label: "🏷 Категории статей" }],
    list: (c) =>
      c.articles.map((a) => ({
        id: a.id,
        title: `${a.published ? "" : "черновик · "}${clip(a.title)}`,
      })),
    fields: (c) => [
      { key: "title", label: "Заголовок", type: "text" },
      { key: "slug", label: "Адрес (slug)", type: "text", hint: "Латиницей, без пробелов." },
      { key: "body", label: "Текст", type: "longtext", hint: "Абзацы разделяйте пустой строкой." },
      { key: "categoryId", label: "Категория", type: "choice", choices: categoryChoices(c.articleCategories) },
      { key: "publishedAt", label: "Дата", type: "date" },
      { key: "published", label: "Опубликована", type: "bool" },
      { key: "seoTitle", label: "SEO-заголовок", type: "text" },
      { key: "seoDescription", label: "SEO-описание", type: "longtext" },
    ],
    read: (c, id) => c.articles.find((a) => a.id === id) as unknown as Record<string, unknown>,
    apply: (id, patch) => core.updateArticle(id, patch),
    remove: (id) => core.deleteArticle(id),
    create: {
      prompt: "Пришлите заголовок новой статьи.",
      run: async (title) =>
        (await core.createArticle({
          slug: slugify(title),
          title,
          categoryId: null,
          body: "",
          seoTitle: "",
          seoDescription: "",
          publishedAt: new Date().toISOString().slice(0, 10),
          published: false,
        })).id,
    },
  },
  {
    id: "newsCats",
    label: "🏷 Категории статей",
    emptyHint: "Категорий пока нет.",
    list: (c) => c.articleCategories.map((x) => ({ id: x.id, title: clip(x.label) })),
    fields: () => [{ key: "label", label: "Название", type: "text" }],
    read: (c, id) => c.articleCategories.find((x) => x.id === id) as unknown as Record<string, unknown>,
    apply: (id, patch) => core.renameArticleCategory(id, String(patch.label ?? "")),
    remove: (id) => core.deleteArticleCategory(id),
    create: {
      prompt: "Пришлите название категории.",
      run: async (label) => (await core.createArticleCategory(label)).id,
    },
  },
  {
    id: "prices",
    label: "💶 Цены",
    emptyHint: "Тарифов пока нет.",
    list: (c) =>
      c.pricePackages.map((p) => ({
        id: p.id,
        title: `${clip(p.title, 28)} · ${p.price} ${p.currency}`,
      })),
    fields: () => [
      { key: "title", label: "Название", type: "text" },
      { key: "price", label: "Цена", type: "number" },
      { key: "currency", label: "Валюта", type: "text" },
      { key: "unit", label: "За что", type: "text", hint: "Например: за занятие." },
      { key: "description", label: "Описание", type: "longtext" },
      { key: "features", label: "Что входит", type: "lines", hint: "По пункту на строку." },
      { key: "featured", label: "Выделен", type: "bool" },
      { key: "ctaLabel", label: "Текст кнопки", type: "text" },
      { key: "ctaHref", label: "Ссылка кнопки", type: "text" },
    ],
    read: (c, id) => c.pricePackages.find((p) => p.id === id) as unknown as Record<string, unknown>,
    apply: (id, patch) => core.updatePricePackage(id, patch),
    remove: (id) => core.deletePricePackage(id),
    move: (id, dir) => core.movePricePackage(id, dir),
    create: {
      prompt: "Пришлите название нового тарифа.",
      run: (title) =>
        core.createPricePackage({
          title,
          price: 0,
          currency: "EUR",
          features: [],
          featured: false,
          ctaLabel: "Записаться",
          ctaHref: "#",
        }),
    },
  },
  {
    id: "games",
    label: "🎾 Игры",
    emptyHint: "Игр пока нет.",
    list: (c) =>
      c.games.map((g) => ({
        id: g.id,
        title: `${showDate(g.startsAt)} · ${clip(g.title, 26)}`,
      })),
    fields: () => [
      { key: "title", label: "Название", type: "text" },
      { key: "startsAt", label: "Начало", type: "datetime", hint: "Время местное, Аликанте." },
      { key: "endsAt", label: "Окончание", type: "datetime", hint: "Время местное, Аликанте." },
      { key: "status", label: "Статус", type: "choice", choices: GAME_STATUSES },
      { key: "format", label: "Формат", type: "text" },
      { key: "location", label: "Место", type: "text" },
      { key: "description", label: "Описание", type: "longtext" },
      { key: "spotsTotal", label: "Всего мест", type: "number" },
      { key: "spotsTaken", label: "Занято мест", type: "number" },
      { key: "signupHref", label: "Ссылка записи", type: "text" },
    ],
    read: (c, id) => c.games.find((g) => g.id === id) as unknown as Record<string, unknown>,
    apply: (id, patch) => core.updateGame(id, patch),
    remove: (id) => core.deleteGame(id),
    move: (id, dir) => core.moveGame(id, dir),
    create: {
      prompt: "Пришлите название новой игры.",
      run: (title) =>
        core.createGame({
          title,
          startsAt: new Date().toISOString(),
          status: "upcoming",
          signupHref: "#",
        }),
    },
  },
  {
    id: "gallery",
    label: "🖼 Галерея",
    emptyHint: "Фотографий пока нет.",
    related: [{ id: "galleryCats", label: "🏷 Категории фото" }],
    list: (c) =>
      c.galleryPhotos.map((p) => ({
        id: p.id,
        title: clip(p.caption || p.alt || `фото · ${categoryName(c.galleryCategories, p.categoryId)}`),
      })),
    fields: (c) => [
      { key: "caption", label: "Подпись", type: "text" },
      { key: "alt", label: "Описание для поиска", type: "text" },
      { key: "categoryId", label: "Категория", type: "choice", choices: categoryChoices(c.galleryCategories) },
    ],
    read: (c, id) => c.galleryPhotos.find((p) => p.id === id) as unknown as Record<string, unknown>,
    apply: (id, patch) => core.updateGalleryPhoto(id, patch),
    remove: (id) => core.deleteGalleryPhoto(id),
    move: (id, dir) => core.moveGalleryPhoto(id, dir),
  },
  {
    id: "galleryCats",
    label: "🏷 Категории фото",
    emptyHint: "Категорий пока нет.",
    list: (c) => c.galleryCategories.map((x) => ({ id: x.id, title: clip(x.label) })),
    fields: () => [{ key: "label", label: "Название", type: "text" }],
    read: (c, id) => c.galleryCategories.find((x) => x.id === id) as unknown as Record<string, unknown>,
    apply: (id, patch) => core.renameGalleryCategory(id, String(patch.label ?? "")),
    remove: (id) => core.deleteGalleryCategory(id),
    create: {
      prompt: "Пришлите название категории.",
      run: async (label) => (await core.createGalleryCategory(label)).id,
    },
  },
  {
    id: "cards",
    label: "🗂 Карточки главной",
    emptyHint: "Карточек пока нет.",
    list: (c) => c.cards.map((x) => ({ id: x.id, title: clip(x.title) })),
    fields: () => [
      { key: "label", label: "Надпись сверху", type: "text" },
      { key: "title", label: "Заголовок", type: "text" },
      { key: "subtitle", label: "Подзаголовок", type: "text" },
      { key: "href", label: "Ссылка", type: "text" },
      { key: "featured", label: "Крупная", type: "bool" },
    ],
    read: (c, id) => c.cards.find((x) => x.id === id) as unknown as Record<string, unknown>,
    apply: (id, patch) => core.updateCard(id, patch),
    remove: (id) => core.deleteCard(id),
    move: (id, dir) => core.moveCard(id, dir),
  },
  {
    id: "seo",
    label: "🔍 SEO страниц",
    emptyHint: "Страниц пока нет.",
    list: (c) => c.seoPages.map((p) => ({ id: p.pageSlug, title: p.pageSlug })),
    fields: () => [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "longtext" },
    ],
    read: (c, id) => c.seoPages.find((p) => p.pageSlug === id) as unknown as Record<string, unknown>,
    apply: async (id, patch) => {
      // upsertSeoPage переписывает строку целиком, поэтому недостающее поле
      // берём из уже сохранённого — иначе правка title стирала бы description.
      const current = (await core.readAdminContent()).seoPages.find((p) => p.pageSlug === id);
      return core.upsertSeoPage(id, {
        title: String(patch.title ?? current?.title ?? ""),
        description: String(patch.description ?? current?.description ?? ""),
      });
    },
  },
  {
    id: "settings",
    label: "⚙️ Настройки сайта",
    single: true,
    list: () => [{ id: "site", title: "Настройки сайта" }],
    fields: () => [
      { key: "siteTitle", label: "Название сайта", type: "text" },
      { key: "siteDescription", label: "Описание сайта", type: "longtext" },
    ],
    read: (c) => c.settings as unknown as Record<string, unknown>,
    apply: (_id, patch) => core.updateSiteSettings(patch),
  },
];

/** Разделы, которые показываем в главном меню (подразделы — из своих списков). */
export const MAIN_MENU = ["news", "prices", "games", "gallery", "cards", "seo", "settings"];

export function section(id: string | undefined): SectionSpec | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function field(spec: SectionSpec, content: AdminContent, key: string): FieldSpec | undefined {
  return spec.fields(content).find((f) => f.key === key);
}

/** Значение поля так, как его показывают на карточке записи. */
export function showValue(spec: FieldSpec, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (spec.type) {
    case "bool":
      return value ? "да" : "нет";
    case "date":
      return showDate(String(value));
    case "datetime":
      return showDateTime(String(value));
    case "lines":
      return Array.isArray(value) && value.length ? value.join(" · ") : "—";
    case "choice":
      return spec.choices?.find((c) => c.value === String(value))?.label ?? String(value);
    default:
      return clip(String(value), 60);
  }
}
