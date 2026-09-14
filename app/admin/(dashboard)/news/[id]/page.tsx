"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useContent } from "@/lib/content-store";
import ArticleForm from "@/components/admin/ArticleForm";
import styles from "@/components/admin/admin-ui.module.css";

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const { articles, ready } = useContent();
  const article = articles.find((a) => a.id === params.id);

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Редактировать статью</h1>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : !article ? (
        <div>
          <p className={styles.empty}>Статья не найдена.</p>
          <Link href="/admin/news" className={styles.btn}>
            Назад к списку
          </Link>
        </div>
      ) : (
        <ArticleForm article={article} />
      )}
    </div>
  );
}
