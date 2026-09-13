"use client";

import { useEffect, useState } from "react";
import { nav } from "@/lib/data";
import { BurgerIcon, CloseIcon, LogoMark } from "./icons";
import styles from "./Header.module.css";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const logo = (onClick?: () => void) => (
    <a
      href="#"
      className={styles.logo}
      aria-label="TOP PADEL ALICANTE"
      onClick={onClick}
    >
      <LogoMark className={styles.logoMark} />
      <span className={styles.logoText}>
        Top Padel
        <br />
        Alicante
      </span>
    </a>
  );

  return (
    <>
      <header className={styles.header} data-scrolled={scrolled}>
        <div className="container">
          <div className={styles.inner}>
            {logo()}

            <nav className={styles.nav} aria-label="Основная навигация">
              {nav.map((item) => (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className={styles.right}>
              <span className={styles.menuLabel}>Меню</span>
              <button
                type="button"
                className={styles.burger}
                aria-label="Открыть меню"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <BurgerIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Rendered as a sibling of <header>: the sticky header uses backdrop-filter,
          which would otherwise become the containing block for this fixed overlay. */}
      <div className={styles.overlay} data-open={open} aria-hidden={!open}>
        <div className={styles.overlayInner}>
          <div className={styles.overlayTop}>
            {logo(() => setOpen(false))}
            <button
              type="button"
              className={styles.burger}
              aria-label="Закрыть меню"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className={styles.overlayNav} aria-label="Меню">
            {nav.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.overlayFoot}>
            <span>Аликанте, Испания</span>
            <span>hello@toppadel.es</span>
            <span>@toppadelalicante</span>
          </div>
        </div>
      </div>
    </>
  );
}
