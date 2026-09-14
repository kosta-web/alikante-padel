import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Community from "@/components/Community";
import Articles from "@/components/Articles";
import {
  getArticleCategories,
  getCards,
  getPublishedArticles,
  getSeoPage,
  getSiteSettings,
} from "@/lib/content/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoPage("/"), getSiteSettings()]);
  return {
    title: seo?.title || settings.siteTitle,
    description: seo?.description || settings.siteDescription,
  };
}

// Три секции, как в макете: герой с карточками разделов, блок сообщества и
// Padel Journal. Игры, цены и галерея живут на своих страницах (/games,
// /prices, /gallery), на главной их нет.
export default async function Page() {
  const [cards, articleCategories, articles] = await Promise.all([
    getCards(),
    getArticleCategories(),
    getPublishedArticles(),
  ]);

  return (
    <>
      <Header />
      <main>
        <Hero cards={cards} />
        <Community />
        <Articles articles={articles} articleCategories={articleCategories} />
      </main>
    </>
  );
}
