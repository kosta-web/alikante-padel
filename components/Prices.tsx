import { pricesSection } from "@/lib/data";
import type { PricePackage } from "@/lib/types";
import { ArrowUpRight } from "./icons";
import Reveal from "./Reveal";
import styles from "./Prices.module.css";

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

export default function Prices({ packages }: { packages: PricePackage[] }) {
  if (packages.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Цены">
      <div className="container">
        <Reveal className={styles.head}>
          <div>
            <p className="eyebrow">{pricesSection.eyebrow}</p>
            <h2 className={styles.title}>
              {pricesSection.titleLines.map((l, i) => (
                <span key={i} className={`${styles.line} ${l.dim ? styles.dim : ""}`}>
                  {l.text}
                </span>
              ))}
            </h2>
          </div>
          <p className={styles.intro}>{pricesSection.body}</p>
        </Reveal>

        <Reveal className={styles.grid} delay={100}>
          {packages.map((p) => (
            <div key={p.id} className={styles.card} data-featured={p.featured || undefined}>
              <span className={styles.title2}>{p.title}</span>
              <span className={styles.price}>
                {formatPrice(p.price, p.currency)}
                {p.unit && <span className={styles.unit}> {p.unit}</span>}
              </span>
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
        </Reveal>

        <Reveal delay={60}>
          <a className={`ghostLink ${styles.more}`} href={pricesSection.allLink.href}>
            {pricesSection.allLink.label}
            <ArrowUpRight style={{ width: 16, height: 16, color: "#7d9c1e" }} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
