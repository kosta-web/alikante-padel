"use client";

import { useMemo, useState } from "react";
import { articles } from "@/lib/data";
import { ArrowUpRight } from "./icons";
import Reveal from "./Reveal";
import styles from "./Articles.module.css";

export default function Articles() {
  const [active, setActive] = useState(articles.filters[0]);

  const visibleItems = useMemo(() => {
    if (active === articles.filters[0]) return articles.items;
    const filtered = articles.items.filter((a) => a.category === active);
    return filtered.length ? filtered : articles.items;
  }, [active]);

  return (
    <section className={styles.section} aria-label="Padel Journal">
      <div className="container">
        <Reveal className={styles.head}>
          <div>
            <p className="eyebrow">{articles.eyebrow}</p>
            <h2 className={styles.title}>
              {articles.titleLines.map((l, i) => (
                <span
                  key={i}
                  className={`${styles.line} ${l.dim ? styles.dim : ""}`}
                >
                  {l.text}
                </span>
              ))}
            </h2>
          </div>
          <p className={styles.intro}>{articles.body}</p>
        </Reveal>

        <Reveal className={styles.filters} delay={80}>
          <div className={`${styles.tabs} noScrollbar`} role="tablist">
            {articles.filters.map((f) => (
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
          <a className={styles.allLink} href={articles.allLink.href}>
            {articles.allLink.label}
            <ArrowUpRight />
          </a>
        </Reveal>

        <Reveal className={`${styles.grid} noScrollbar`} delay={120}>
          {visibleItems.map((a) => (
            <a key={a.num} href={a.href} className={styles.card}>
              <span className={styles.media}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image} alt="" />
              </span>
              <span className={styles.num}>{a.num}</span>
              <span className={styles.cardBottom}>
                <span className={styles.cat}>{a.category}</span>
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
          <a className={`ghostLink ${styles.more}`} href={articles.moreLink.href}>
            {articles.moreLink.label}
            <ArrowUpRight style={{ width: 16, height: 16, color: "#7d9c1e" }} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
