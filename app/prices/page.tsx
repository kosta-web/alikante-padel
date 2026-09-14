import type { Metadata } from "next";
import Header from "@/components/Header";
import { getPricePackages, getSeoPage, getSiteSettings } from "@/lib/content/queries";
import styles from "./prices.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoPage("/prices"), getSiteSettings()]);
  return {
    title: seo?.title || settings.siteTitle,
    description: seo?.description || settings.siteDescription,
  };
}

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export default async function PricesPage() {
  const packages = await getPricePackages();

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <p className="eyebrow">Цены</p>
          <h1 className={styles.title}>Тренировки и абонементы</h1>

          {packages.length === 0 ? (
            <p className={styles.empty}>Тарифы скоро появятся.</p>
          ) : (
            <div className={styles.grid}>
              {packages.map((p) => (
                <div key={p.id} className={styles.card} data-featured={p.featured || undefined}>
                  <span className={styles.cardTitle}>{p.title}</span>
                  <span className={styles.price}>
                    {formatPrice(p.price, p.currency)}
                    {p.unit && <span className={styles.unit}> {p.unit}</span>}
                  </span>
                  {p.description && <p className={styles.description}>{p.description}</p>}
                  {p.features.length > 0 && (
                    <ul className={styles.features}>
                      {p.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                  <a className={styles.cta} href={p.ctaHref}>
                    {p.ctaLabel}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
