import type { Metadata } from "next";
import Header from "@/components/Header";
import { getGalleryCategories, getGalleryPhotos, getSeoPage, getSiteSettings } from "@/lib/content/queries";
import GalleryView from "./GalleryView";
import styles from "./gallery.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoPage("/gallery"), getSiteSettings()]);
  return {
    title: seo?.title || settings.siteTitle,
    description: seo?.description || settings.siteDescription,
  };
}

export default async function GalleryPage() {
  const [categories, photos] = await Promise.all([getGalleryCategories(), getGalleryPhotos()]);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <p className="eyebrow">Галерея</p>
          <h1 className={styles.title}>Фото с тренировок и турниров</h1>
          <GalleryView categories={categories} photos={photos} />
        </div>
      </main>
    </>
  );
}
