"use client";

/* ------------------------------------------------------------------
   Content store for /admin. Fetches everything (including drafts) from
   Supabase via the service-role-backed Server Actions in
   `lib/content/queries.ts` / `lib/content/actions.ts`, and mirrors it
   into local state so the existing admin pages keep their optimistic,
   instantly-updating UI. Mounted only inside the admin dashboard layout
   — the public site reads Supabase directly in Server Components and
   never sees this store (so drafts never ship to anonymous visitors).
------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAdminContent, type AdminContent } from "./content/queries";
import * as actions from "./content/actions";
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
} from "./types";

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(input: string) {
  const transliterated = input
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join("");
  const slug = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "article";
}

function emptyState(): AdminContent {
  return {
    cards: [],
    articleCategories: [],
    articles: [],
    games: [],
    pricePackages: [],
    galleryCategories: [],
    galleryPhotos: [],
    settings: { siteTitle: "TOP PADEL ALICANTE", siteDescription: "" },
    seoPages: [],
  };
}

type ContentApi = AdminContent & {
  ready: boolean;
  refresh: () => Promise<void>;

  addCard: (card: Omit<Card, "id" | "sortOrder">) => Promise<void>;
  updateCard: (id: string, patch: Partial<Omit<Card, "id">>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  moveCard: (id: string, direction: -1 | 1) => Promise<void>;

  addArticleCategory: (label: string) => Promise<ArticleCategory>;
  renameArticleCategory: (id: string, label: string) => Promise<void>;
  removeArticleCategory: (id: string) => Promise<void>;

  addArticle: (input: Omit<Article, "id">) => Promise<Article>;
  updateArticle: (id: string, patch: Partial<Omit<Article, "id">>) => Promise<void>;
  removeArticle: (id: string) => Promise<void>;
  /** Slugifies `text` and, if needed, appends -2/-3/… to keep it unique among current articles. */
  uniqueSlug: (text: string, ignoreId?: string) => string;

  addGame: (input: Omit<Game, "id" | "sortOrder">) => Promise<void>;
  updateGame: (id: string, patch: Partial<Omit<Game, "id">>) => Promise<void>;
  removeGame: (id: string) => Promise<void>;
  moveGame: (id: string, direction: -1 | 1) => Promise<void>;

  addPricePackage: (input: Omit<PricePackage, "id" | "sortOrder">) => Promise<void>;
  updatePricePackage: (id: string, patch: Partial<Omit<PricePackage, "id">>) => Promise<void>;
  removePricePackage: (id: string) => Promise<void>;
  movePricePackage: (id: string, direction: -1 | 1) => Promise<void>;

  addGalleryCategory: (label: string) => Promise<void>;
  renameGalleryCategory: (id: string, label: string) => Promise<void>;
  removeGalleryCategory: (id: string) => Promise<void>;

  addGalleryPhoto: (input: Omit<GalleryPhoto, "id" | "sortOrder">) => Promise<void>;
  updateGalleryPhoto: (id: string, patch: Partial<Omit<GalleryPhoto, "id">>) => Promise<void>;
  removeGalleryPhoto: (id: string) => Promise<void>;
  moveGalleryPhoto: (id: string, direction: -1 | 1) => Promise<void>;

  updateSettings: (patch: Partial<SiteSettings>) => Promise<void>;
  updateSeoPage: (pageSlug: string, patch: { title: string; description: string }) => Promise<void>;
};

const ContentContext = createContext<ContentApi | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminContent>(emptyState);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const fresh = await getAdminContent();
    setState(fresh);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uniqueSlug = useCallback(
    (text: string, ignoreId?: string) => {
      const base = slugify(text);
      let candidate = base;
      let n = 2;
      while (state.articles.some((a) => a.slug === candidate && a.id !== ignoreId)) {
        candidate = `${base}-${n++}`;
      }
      return candidate;
    },
    [state.articles]
  );

  const api = useMemo<ContentApi>(
    () => ({
      ...state,
      ready,
      refresh,
      uniqueSlug,

      addCard: async (card) => {
        await actions.createCard(card);
        await refresh();
      },
      updateCard: async (id, patch) => {
        await actions.updateCard(id, patch);
        await refresh();
      },
      removeCard: async (id) => {
        await actions.deleteCard(id);
        await refresh();
      },
      moveCard: async (id, direction) => {
        await actions.moveCard(id, direction);
        await refresh();
      },

      addArticleCategory: async (label) => {
        const category = await actions.createArticleCategory(label);
        await refresh();
        return category;
      },
      renameArticleCategory: async (id, label) => {
        await actions.renameArticleCategory(id, label);
        await refresh();
      },
      removeArticleCategory: async (id) => {
        await actions.deleteArticleCategory(id);
        await refresh();
      },

      addArticle: async (input) => {
        const article = await actions.createArticle(input);
        await refresh();
        return article;
      },
      updateArticle: async (id, patch) => {
        await actions.updateArticle(id, patch);
        await refresh();
      },
      removeArticle: async (id) => {
        await actions.deleteArticle(id);
        await refresh();
      },

      addGame: async (input) => {
        await actions.createGame(input);
        await refresh();
      },
      updateGame: async (id, patch) => {
        await actions.updateGame(id, patch);
        await refresh();
      },
      removeGame: async (id) => {
        await actions.deleteGame(id);
        await refresh();
      },
      moveGame: async (id, direction) => {
        await actions.moveGame(id, direction);
        await refresh();
      },

      addPricePackage: async (input) => {
        await actions.createPricePackage(input);
        await refresh();
      },
      updatePricePackage: async (id, patch) => {
        await actions.updatePricePackage(id, patch);
        await refresh();
      },
      removePricePackage: async (id) => {
        await actions.deletePricePackage(id);
        await refresh();
      },
      movePricePackage: async (id, direction) => {
        await actions.movePricePackage(id, direction);
        await refresh();
      },

      addGalleryCategory: async (label) => {
        await actions.createGalleryCategory(label);
        await refresh();
      },
      renameGalleryCategory: async (id, label) => {
        await actions.renameGalleryCategory(id, label);
        await refresh();
      },
      removeGalleryCategory: async (id) => {
        await actions.deleteGalleryCategory(id);
        await refresh();
      },

      addGalleryPhoto: async (input) => {
        await actions.createGalleryPhoto(input);
        await refresh();
      },
      updateGalleryPhoto: async (id, patch) => {
        await actions.updateGalleryPhoto(id, patch);
        await refresh();
      },
      removeGalleryPhoto: async (id) => {
        await actions.deleteGalleryPhoto(id);
        await refresh();
      },
      moveGalleryPhoto: async (id, direction) => {
        await actions.moveGalleryPhoto(id, direction);
        await refresh();
      },

      updateSettings: async (patch) => {
        await actions.updateSiteSettings(patch);
        await refresh();
      },
      updateSeoPage: async (pageSlug, patch) => {
        await actions.upsertSeoPage(pageSlug, patch);
        await refresh();
      },
    }),
    [state, ready, refresh, uniqueSlug]
  );

  return <ContentContext.Provider value={api}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within a ContentProvider");
  return ctx;
}
