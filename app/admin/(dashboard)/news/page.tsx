"use client";

import Link from "next/link";
import { useContent } from "@/lib/content-store";
import styles from "@/components/admin/admin-ui.module.css";

export default function NewsListPage() {
  const { articles, articleCategories, removeArticle, ready } = useContent();

  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  function categoryLabel(categoryId: string | null) {
    return articleCategories.find((c) => c.id === categoryId)?.label ?? "Без категории";
  }

  function remove(id: string, title: string) {
    if (confirm(`Удалить статью «${title}»?`)) removeArticle(id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Новости</h1>
          <p className={styles.pageLead}>
            Статьи блога, которые показываются в разделе Padel Journal на главной.
          </p>
        </div>
        <Link href="/admin/news/new" className={styles.primaryBtn}>
          + Новая статья
        </Link>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : sorted.length === 0 ? (
        <p className={styles.empty}>Пока нет ни одной новости.</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((a) => (
            <li key={a.id} className={styles.listItem}>
              <div className={styles.listRow}>
                {a.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt="" className={styles.thumb} />
                ) : (
                  <div className={styles.thumbPlaceholder} />
                )}
                <div className={styles.listInfo}>
                  <span className={styles.listTitle}>{a.title}</span>
                  <span className={styles.listMeta}>
                    {categoryLabel(a.categoryId)} · {a.published ? "опубликовано" : "черновик"}
                  </span>
                </div>
                <div className={styles.listActions}>
                  <Link href={`/articles/${a.slug}`} target="_blank" className={styles.btn}>
                    Открыть
                  </Link>
                  <Link href={`/admin/news/${a.id}`} className={styles.btn}>
                    Изменить
                  </Link>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => remove(a.id, a.title)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
