"use client";

import { useMemo, useState } from "react";
import type { GalleryCategory, GalleryPhoto } from "@/lib/types";
import styles from "./gallery.module.css";

const ALL_FILTER = "Все";

export default function GalleryView({
  categories,
  photos,
}: {
  categories: GalleryCategory[];
  photos: GalleryPhoto[];
}) {
  const [active, setActive] = useState(ALL_FILTER);

  const filters = useMemo(() => [ALL_FILTER, ...categories.map((c) => c.label)], [categories]);

  function categoryLabel(categoryId: string | null) {
    return categories.find((c) => c.id === categoryId)?.label ?? null;
  }

  const visible = useMemo(() => {
    if (active === ALL_FILTER) return photos;
    return photos.filter((p) => categoryLabel(p.categoryId) === active);
  }, [active, photos, categories]);

  if (photos.length === 0) {
    return <p className={styles.empty}>Фото скоро появятся.</p>;
  }

  return (
    <>
      {categories.length > 0 && (
        <div className={`${styles.tabs} noScrollbar`} role="tablist">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active === f}
              className={styles.tab}
              data-active={active === f}
              onClick={() => setActive(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className={styles.grid}>
        {visible.map((p) => (
          <figure key={p.id} className={styles.item}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.alt ?? ""} loading="lazy" />
            {p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </>
  );
}
