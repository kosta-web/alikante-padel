import { gamesSection } from "@/lib/data";
import type { Game } from "@/lib/types";
import { ArrowUpRight } from "./icons";
import Reveal from "./Reveal";
import styles from "./Games.module.css";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Games({ games }: { games: Game[] }) {
  if (games.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Игры и мероприятия">
      <div className="container">
        <Reveal className={styles.head}>
          <div>
            <p className="eyebrow">{gamesSection.eyebrow}</p>
            <h2 className={styles.title}>
              {gamesSection.titleLines.map((l, i) => (
                <span key={i} className={`${styles.line} ${l.dim ? styles.dim : ""}`}>
                  {l.text}
                </span>
              ))}
            </h2>
          </div>
          <p className={styles.intro}>{gamesSection.body}</p>
        </Reveal>

        <Reveal className={styles.grid} delay={100}>
          {games.map((g) => (
            <div key={g.id} className={styles.card}>
              <span className={styles.date}>{formatDate(g.startsAt)}</span>
              <span className={styles.title2}>{g.title}</span>
              {g.location && <span className={styles.meta}>{g.location}</span>}
              <a className={styles.cta} href={g.signupHref}>
                Записаться
                <ArrowUpRight style={{ width: 16, height: 16 }} />
              </a>
            </div>
          ))}
        </Reveal>

        <Reveal delay={60}>
          <a className={`ghostLink ${styles.more}`} href={gamesSection.allLink.href}>
            {gamesSection.allLink.label}
            <ArrowUpRight style={{ width: 16, height: 16, color: "#7d9c1e" }} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
