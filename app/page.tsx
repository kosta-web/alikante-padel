import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Games from "@/components/Games";
import Prices from "@/components/Prices";
import Community from "@/components/Community";
import Gallery from "@/components/Gallery";
import Articles from "@/components/Articles";
import {
  getArticleCategories,
  getCards,
  getGalleryPhotos,
  getGames,
  getPricePackages,
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

export default async function Page() {
  const [cards, games, pricePackages, galleryPhotos, articleCategories, articles] =
    await Promise.all([
      getCards(),
      getGames({ limit: 3, excludeStatuses: ["completed", "cancelled"] }),
      getPricePackages(),
      getGalleryPhotos({ limit: 6 }),
      getArticleCategories(),
      getPublishedArticles(),
    ]);

  return (
    <>
      <Header />
      <main>
        <Hero cards={cards} />
        <Games games={games} />
        <Prices packages={pricePackages.slice(0, 3)} />
        <Community />
        <Gallery photos={galleryPhotos} />
        <Articles articles={articles} articleCategories={articleCategories} />
      </main>
    </>
  );
}
