"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { categories } from "@/lib/data";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "./icons";
import Reveal from "./Reveal";
import styles from "./CategoryCards.module.css";

export default function CategoryCards() {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const hoverIndexRef = useRef<number | null>(null);

  // Which card is "active" is derived from the pointer's position over
  // fixed, evenly-sized slots rather than each card's own :hover state.
  // The cards themselves resize on hover, so using their live hitbox to
  // decide the active card creates a feedback loop (a shrinking neighbour
  // slides out from under the cursor, handing hover to the next card,
  // which then shrinks too) that reads as the whole row jittering.
  const handlePointerMove = useCallback((e: ReactMouseEvent) => {
    const el = scroller.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const slot = rect.width / categories.length;
    const idx = Math.max(
      0,
      Math.min(categories.length - 1, Math.floor((e.clientX - rect.left) / slot))
    );
    if (hoverIndexRef.current !== idx) {
      hoverIndexRef.current = idx;
      setHoverIndex(idx);
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    hoverIndexRef.current = null;
    setHoverIndex(null);
  }, []);

  const syncEdges = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges]);

  // one card + one gap per click
  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 17 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className={styles.wrap} aria-label="Разделы клуба">
      <div className="container">
        <Reveal>
          <div
            className={`${styles.grid} noScrollbar`}
            ref={scroller}
            data-hover={hoverIndex !== null || undefined}
            onMouseMove={handlePointerMove}
            onMouseLeave={handlePointerLeave}
          >
            {categories.map((c, i) => (
              <a
                key={c.title + c.label}
                href={c.href}
                className={styles.card}
                data-open={c.featured || undefined}
                data-hover-active={hoverIndex === i || undefined}
              >
                <span className={styles.media}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    style={c.focus ? { objectPosition: c.focus } : undefined}
                  />
                </span>

                <span className={styles.top}>
                  <span className={styles.pill}>{c.label}</span>
                  <ArrowUpRight className={styles.arrow} />
                </span>

                <span className={styles.title}>{c.title}</span>
                {c.subtitle && (
                  <span className={styles.subtitle}>{c.subtitle}</span>
                )}
              </a>
            ))}
          </div>

          <div className={styles.nav}>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Предыдущие разделы"
              onClick={() => page(-1)}
              disabled={atStart}
            >
              <ArrowLeft />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Следующие разделы"
              onClick={() => page(1)}
              disabled={atEnd}
            >
              <ArrowRight />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
