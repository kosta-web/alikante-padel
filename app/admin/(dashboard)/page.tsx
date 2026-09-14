"use client";

import Link from "next/link";
import { useContent } from "@/lib/content-store";
import styles from "@/components/admin/admin-ui.module.css";

export default function AdminHomePage() {
  const { cards, articles, articleCategories, games, pricePackages, galleryPhotos, ready } =
    useContent();

  const stats = [
    { label: "Карточек на главной", value: cards.length, href: "/admin/cards" },
    { label: "Игр и мероприятий", value: games.length, href: "/admin/games" },
    { label: "Тарифов", value: pricePackages.length, href: "/admin/prices" },
    { label: "Фото в галерее", value: galleryPhotos.length, href: "/admin/gallery" },
    { label: "Новостей", value: articles.length, href: "/admin/news" },
    {
      label: "Опубликовано",
      value: articles.filter((a) => a.published).length,
      href: "/admin/news",
    },
    { label: "Категорий блога", value: articleCategories.length, href: "/admin/categories" },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Панель управления</h1>
          <p className={styles.pageLead}>
            Здесь можно менять карточки главного экрана, вести новости и настроить сайт —
            без правки кода.
          </p>
        </div>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : (
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className={styles.statCard}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </Link>
          ))}
        </div>
      )}

      <div className={styles.quickLinks}>
        <Link href="/admin/news/new" className={styles.primaryBtn}>
          + Новая статья
        </Link>
        <Link href="/" target="_blank" className={styles.ghostBtnLink}>
          Открыть сайт ↗
        </Link>
      </div>
    </div>
  );
}
