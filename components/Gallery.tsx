import { gallerySection } from "@/lib/data";
import type { GalleryPhoto } from "@/lib/types";
import { ArrowUpRight } from "./icons";
import Reveal from "./Reveal";
import styles from "./Gallery.module.css";

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Галерея">
      <div className="container">
        <Reveal className={styles.head}>
          <div>
            <p className="eyebrow">{gallerySection.eyebrow}</p>
            <h2 className={styles.title}>
              {gallerySection.titleLines.map((l, i) => (
                <span key={i} className={`${styles.line} ${l.dim ? styles.dim : ""}`}>
                  {l.text}
                </span>
              ))}
            </h2>
          </div>
          <p className={styles.intro}>{gallerySection.body}</p>
        </Reveal>

        <Reveal className={styles.grid} delay={100}>
          {photos.map((p) => (
            <a key={p.id} href={gallerySection.allLink.href} className={styles.item}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.alt ?? ""} loading="lazy" />
            </a>
          ))}
        </Reveal>

        <Reveal delay={60}>
          <a className={`ghostLink ${styles.more}`} href={gallerySection.allLink.href}>
            {gallerySection.allLink.label}
            <ArrowUpRight style={{ width: 16, height: 16, color: "#7d9c1e" }} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
