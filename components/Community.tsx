"use client";

import { community } from "@/lib/data";
import { ArrowUpRight, TelegramIcon } from "./icons";
import Reveal from "./Reveal";
import styles from "./Community.module.css";

export default function Community() {
  return (
    <section className={styles.section} aria-label="Сообщество">
      <div className="container">
        <div className={styles.layout}>
          <Reveal className={styles.copy}>
            <p className="eyebrow">{community.eyebrow}</p>
            <h2 className={styles.title}>
              {community.titleLines.map((l, i) => (
                <span
                  key={i}
                  className={`${styles.line} ${l.dim ? styles.dim : ""}`}
                >
                  {l.text}
                </span>
              ))}
            </h2>
            <p className={styles.body}>{community.body}</p>
            <a className={styles.cta} href={community.cta.href}>
              <TelegramIcon className={styles.tg} />
              {community.cta.label}
              <ArrowUpRight className={styles.arr} />
            </a>
          </Reveal>

          <Reveal delay={120}>
            <div className={styles.media}>
              <div className={styles.mediaInner}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={community.image} alt="Игроки на корте в Аликанте" />
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal as="ul" className={styles.features} delay={80}>
          {community.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
