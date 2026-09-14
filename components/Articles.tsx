"use client";

import { useMemo, useState } from "react";
import { articlesSection } from "@/lib/data";
import type { Article, ArticleCategory } from "@/lib/types";
import { ArrowUpRight } from "./icons";
import Reveal from "./Reveal";
import styles from "./Articles.module.css";

const ALL_FILTER = "Все";

export default function Articles({
  articles,
  articleCategories,
}: {
  articles: Article[];
  articleCategories: ArticleCategory[];
}) {
  const [active, setActive] = useState(ALL_FILTER);

  const filters = useMemo(
    () => [ALL_FILTER, ...articleCategories.map((c) => c.label)],
    [articleCategories]
  );

  function categoryLabel(categoryId: string | null) {
    return articleCategories.find((c) => c.id === categoryId)?.label ?? "Без категории";
  }

  const publishedItems = useMemo(
    () =>
      [...articles].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    [articles]
  );

  const visibleItems = useMemo(() => {
    if (active === ALL_FILTER) return publishedItems;
    const filtered = publishedItems.filter((a) => categoryLabel(a.categoryId) === active);
    return filtered.length ? filtered : publishedItems;
  }, [active, publishedItems, articleCategories]);

  return (
    <section className={styles.section} aria-label="Padel Journal">
      <div className="container">
        <Reveal className={styles.head}>
          <div>
            <p className="eyebrow">{articlesSection.eyebrow}</p>
            <h2 className={styles.title}>
              {articlesSection.titleLines.map((l, i) => (
                <span
                  key={i}
                  className={`${styles.line} ${l.dim ? styles.dim : ""}`}
                >
                  {l.text}
                </span>
              ))}
            </h2>
          </div>
          <p className={styles.intro}>{articlesSection.body}</p>
        </Reveal>

        <Reveal className={styles.filters} delay={80}>
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
          <a className={styles.allLink} href={articlesSection.allLink.href}>
            {articlesSection.allLink.label}
            <ArrowUpRight />
          </a>
        </Reveal>

        <Reveal className={`${styles.grid} noScrollbar`} delay={120}>
          {visibleItems.map((a, i) => (
            <a key={a.id} href={`/articles/${a.slug}`} className={styles.card}>
              <span className={styles.media}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image} alt="" />
              </span>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.cardBottom}>
                <span className={styles.cat}>{categoryLabel(a.categoryId)}</span>
                <span className={styles.cardTitle}>{a.title}</span>
                <span className={styles.read}>
                  Читать статью
                  <ArrowUpRight />
                </span>
              </span>
            </a>
          ))}
        </Reveal>

        <Reveal delay={60}>
          <a className={`ghostLink ${styles.more}`} href={articlesSection.moreLink.href}>
            {articlesSection.moreLink.label}
            <ArrowUpRight style={{ width: 16, height: 16, color: "#7d9c1e" }} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
