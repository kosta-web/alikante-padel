import { hero } from "@/lib/data";
import type { Card } from "@/lib/types";
import CategoryCards from "./CategoryCards";
import Reveal from "./Reveal";
import styles from "./Hero.module.css";

export default function Hero({ cards }: { cards: Card[] }) {
  return (
    <section className={styles.hero}>
      <div className="container">
        <Reveal as="h1" className={styles.title}>
          {hero.titleLines.map((line, i) => (
            <span
              key={i}
              className={`${styles.line} ${line.dim ? styles.dim : ""}`}
            >
              {line.text}
            </span>
          ))}
        </Reveal>

        <Reveal className={styles.subs} delay={120}>
          <p className={styles.sub}>{hero.left}</p>
          <p className={styles.sub}>{hero.right}</p>
        </Reveal>
      </div>

      <CategoryCards cards={cards} />
    </section>
  );
}
